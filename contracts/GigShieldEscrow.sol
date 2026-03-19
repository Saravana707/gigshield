// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GigShieldEscrow
 * @dev Holds payment in escrow between a client and freelancer.
 *      Funds are locked until milestones are approved or a dispute is resolved.
 */
contract GigShieldEscrow {

    // ── Enums ────────────────────────────────────────────────────────────────

    enum Status {
        AWAITING_PAYMENT,   // Contract created, client hasn't deposited yet
        FUNDED,             // Client deposited — work can begin
        IN_PROGRESS,        // Freelancer confirmed work started
        MILESTONE_REVIEW,   // Freelancer submitted milestone for approval
        DISPUTED,           // Dispute triggered — funds locked pending resolution
        COMPLETED,          // All funds released to freelancer
        REFUNDED            // Funds returned to client
    }

    // ── State ────────────────────────────────────────────────────────────────

    address public client;
    address public freelancer;
    address public arbiter;          // GigShield platform address (for dispute resolution)

    uint256 public totalAmount;
    uint256 public platformFeeBps;   // basis points e.g. 100 = 1%

    string  public jobTitle;
    string  public ipfsContractCID;  // IPFS CID of the signed contract document
    string  public ipfsEvidenceCID;  // IPFS CID of dispute evidence (set on dispute)

    uint256 public milestoneCount;
    uint256 public milestonesCompleted;

    Status  public status;

    uint256 public createdAt;
    uint256 public fundedAt;
    uint256 public completedAt;

    // ── Events ───────────────────────────────────────────────────────────────

    event Funded(address indexed client, uint256 amount, uint256 timestamp);
    event WorkStarted(address indexed freelancer, uint256 timestamp);
    event MilestoneSubmitted(uint256 milestoneIndex, uint256 timestamp);
    event MilestoneApproved(uint256 milestoneIndex, uint256 amountReleased, uint256 timestamp);
    event DisputeRaised(address indexed raisedBy, string evidenceCID, uint256 timestamp);
    event DisputeResolved(address indexed resolvedBy, uint8 ruling, uint256 freelancerAmount, uint256 clientAmount);
    event FundsReleased(address indexed to, uint256 amount, uint256 timestamp);
    event Refunded(address indexed to, uint256 amount, uint256 timestamp);

    // ── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyClient()     { require(msg.sender == client,     "Only client");     _; }
    modifier onlyFreelancer() { require(msg.sender == freelancer, "Only freelancer"); _; }
    modifier onlyArbiter()    { require(msg.sender == arbiter,    "Only arbiter");    _; }
    modifier onlyParties()    { require(msg.sender == client || msg.sender == freelancer, "Only parties"); _; }

    modifier inStatus(Status _status) {
        require(status == _status, "Invalid contract status for this action");
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor(
        address _client,
        address _freelancer,
        address _arbiter,
        string memory _jobTitle,
        string memory _ipfsContractCID,
        uint256 _milestoneCount,
        uint256 _platformFeeBps
    ) {
        require(_client != address(0) && _freelancer != address(0), "Invalid addresses");
        require(_client != _freelancer, "Client and freelancer cannot be the same");
        require(_milestoneCount > 0 && _milestoneCount <= 10, "1-10 milestones");
        require(_platformFeeBps <= 500, "Fee cannot exceed 5%");

        client          = _client;
        freelancer      = _freelancer;
        arbiter         = _arbiter;
        jobTitle        = _jobTitle;
        ipfsContractCID = _ipfsContractCID;
        milestoneCount  = _milestoneCount;
        platformFeeBps  = _platformFeeBps;
        status          = Status.AWAITING_PAYMENT;
        createdAt       = block.timestamp;
    }

    // ── Client Actions ───────────────────────────────────────────────────────

    /**
     * @dev Client deposits the full project payment into escrow.
     *      Must match the expected amount exactly.
     */
    function deposit() external payable onlyClient inStatus(Status.AWAITING_PAYMENT) {
        require(msg.value > 0, "Must deposit non-zero amount");

        totalAmount = msg.value;
        fundedAt    = block.timestamp;
        status      = Status.FUNDED;

        emit Funded(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @dev Client approves a submitted milestone and releases proportional funds.
     */
    function approveMilestone() external onlyClient {
        require(
            status == Status.MILESTONE_REVIEW || status == Status.IN_PROGRESS,
            "No milestone pending review"
        );

        milestonesCompleted++;
        uint256 amountToRelease = totalAmount / milestoneCount;

        // Calculate and deduct platform fee
        uint256 platformFee = (amountToRelease * platformFeeBps) / 10000;
        uint256 freelancerAmount = amountToRelease - platformFee;

        if (milestonesCompleted >= milestoneCount) {
            // Last milestone — release everything remaining
            uint256 remaining = address(this).balance;
            freelancerAmount = remaining - (remaining * platformFeeBps / 10000);
            platformFee = remaining - freelancerAmount;

            completedAt = block.timestamp;
            status = Status.COMPLETED;
        } else {
            status = Status.IN_PROGRESS;
        }

        _transfer(freelancer, freelancerAmount);
        if (platformFee > 0) _transfer(arbiter, platformFee);

        emit MilestoneApproved(milestonesCompleted, freelancerAmount, block.timestamp);
        emit FundsReleased(freelancer, freelancerAmount, block.timestamp);
    }

    /**
     * @dev Client requests a refund. Only valid if work hasn't started yet.
     */
    function requestRefund() external onlyClient {
        require(status == Status.FUNDED, "Can only refund before work starts");

        uint256 amount = address(this).balance;
        status = Status.REFUNDED;

        _transfer(client, amount);
        emit Refunded(client, amount, block.timestamp);
    }

    // ── Freelancer Actions ───────────────────────────────────────────────────

    /**
     * @dev Freelancer confirms they have started the work.
     */
    function startWork() external onlyFreelancer inStatus(Status.FUNDED) {
        status = Status.IN_PROGRESS;
        emit WorkStarted(msg.sender, block.timestamp);
    }

    /**
     * @dev Freelancer submits a milestone for client review.
     */
    function submitMilestone() external onlyFreelancer inStatus(Status.IN_PROGRESS) {
        status = Status.MILESTONE_REVIEW;
        emit MilestoneSubmitted(milestonesCompleted + 1, block.timestamp);
    }

    // ── Dispute Actions ──────────────────────────────────────────────────────

    /**
     * @dev Either party can raise a dispute. Evidence must be pinned to IPFS first.
     */
    function raiseDispute(string calldata _evidenceCID) external onlyParties {
        require(
            status == Status.FUNDED ||
            status == Status.IN_PROGRESS ||
            status == Status.MILESTONE_REVIEW,
            "Cannot dispute in current state"
        );
        require(bytes(_evidenceCID).length > 0, "Evidence CID required");

        ipfsEvidenceCID = _evidenceCID;
        status = Status.DISPUTED;

        emit DisputeRaised(msg.sender, _evidenceCID, block.timestamp);
    }

    /**
     * @dev Arbiter (GigShield platform / AI mediator) resolves the dispute.
     * @param freelancerBps Percentage of funds (in basis points) going to freelancer
     *                      e.g. 10000 = 100% to freelancer, 0 = 100% to client
     */
    function resolveDispute(uint256 freelancerBps) external onlyArbiter inStatus(Status.DISPUTED) {
        require(freelancerBps <= 10000, "Basis points cannot exceed 10000");

        uint256 total = address(this).balance;
        uint256 platformFee = (total * platformFeeBps) / 10000;
        uint256 distributable = total - platformFee;

        uint256 freelancerAmount = (distributable * freelancerBps) / 10000;
        uint256 clientAmount = distributable - freelancerAmount;

        status = Status.COMPLETED;
        completedAt = block.timestamp;

        if (freelancerAmount > 0) _transfer(freelancer, freelancerAmount);
        if (clientAmount > 0)     _transfer(client, clientAmount);
        if (platformFee > 0)      _transfer(arbiter, platformFee);

        emit DisputeResolved(msg.sender, uint8(freelancerBps > 5000 ? 1 : 0), freelancerAmount, clientAmount);
    }

    // ── Views ────────────────────────────────────────────────────────────────

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getContractInfo() external view returns (
        address _client,
        address _freelancer,
        uint256 _totalAmount,
        uint256 _balance,
        Status  _status,
        uint256 _milestonesCompleted,
        uint256 _milestoneCount,
        string memory _jobTitle,
        string memory _ipfsContractCID,
        string memory _ipfsEvidenceCID
    ) {
        return (
            client,
            freelancer,
            totalAmount,
            address(this).balance,
            status,
            milestonesCompleted,
            milestoneCount,
            jobTitle,
            ipfsContractCID,
            ipfsEvidenceCID
        );
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    function _transfer(address _to, uint256 _amount) internal {
        if (_amount == 0) return;
        (bool success, ) = payable(_to).call{value: _amount}("");
        require(success, "Transfer failed");
    }

    receive() external payable {}
}
