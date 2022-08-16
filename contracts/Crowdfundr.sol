//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Crowdfundr is ReentrancyGuard, ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    uint256 public goal;
    bool public completed = false;
    bool public cancelled = false;
    uint256 public startTime;
    address public owner;
    uint256 timeLimit = 30 days;
    uint256 minContribution = 0.01 ether;

    uint256 public totalContributions;
    mapping(address => uint256) public contributions;
    mapping(address => uint256) public nftsGranted;

    constructor(address _owner, uint256 _goal) ERC721("Crowdfundr", "FDR") {
        owner = _owner;
        goal = _goal;
        startTime = block.timestamp;
    }

    // Helper functions

    function getContribution(address contributor) public view returns (uint256) {
        return contributions[contributor];
    }

    function goalMet() public view returns (bool) {
        return totalContributions > goal;
    }

    function timeLimitOver() public view returns (bool) {
        return (block.timestamp - startTime) > timeLimit;
    }

    function failed() public view returns (bool) {
        return !goalMet() && timeLimitOver();
    }

    // Modifiers

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier isCancelled() {
        require(cancelled, "crowdfund not cancelled");
        _;
    }

    modifier isNotCancelled() {
        require(!cancelled, "crowdfund cancelled");
        _;
    }

    modifier crowdfundFailed() {
        require(timeLimitOver() && !goalMet(), "crowfund not failed");
        _;
    }

    modifier isFailed() {
        require(failed(), "crowdfund not failed");
        _;
    }

    modifier isTimeLimitOver() {
        require(timeLimitOver(), "crowdfund timelimit not over");
        _;
    }

    modifier isTimeLimitNotOver() {
        require(!timeLimitOver(), "crowdfund timelimit is over");
        _;
    }

    modifier isGoalMet() {
        require(goalMet(), "contribution limit not met");
        _;
    }

    modifier isGoalNotMet() {
        require(!goalMet(), "contribution limit is met");
        _;
    }

    modifier isCompleted() {
        require(completed, "not completed");
        _;
    }

    modifier isNotCompleted() {
        require(!completed, "not completed");
        _;
    }

    // Owner only functions
    // Withdraw if the goal limit is reached
    function ownerWithdraw(uint256 amount)
        public
        onlyOwner
        nonReentrant
        isTimeLimitNotOver
        isNotCancelled
        isGoalMet
        isCompleted
    {
        // Allow owner to withdraw contract balance in case some funds are self destructed into it
        require(amount <= address(this).balance, "withdrawal over contributions");
        totalContributions -= amount;
        payable(msg.sender).transfer(amount);
    }

    function cancelFundraise() public onlyOwner isGoalNotMet isTimeLimitNotOver isNotCompleted {
        cancelled = true;
    }

    // Contributor functions

    // Cancelled or failed
    function contributorWithdraw() public nonReentrant {
        require(failed() || cancelled, "not failed or cancelled");
        uint256 contributed = contributions[msg.sender];
        contributions[msg.sender] = 0;
        payable(msg.sender).transfer(contributed);
    }

    // Goal not met
    // Time limit is not over
    // is not cancelled
    function contribute() public payable nonReentrant isGoalNotMet isTimeLimitNotOver isNotCancelled {
        require(msg.value >= minContribution, "min contribution is 0.01 ether");
        contributions[msg.sender] += msg.value;
        totalContributions += msg.value;
        handleNFTGrant(msg.sender);
        if (totalContributions >= goal) {
            completed = true;
        }
    }

    // Internal functions
    function handleNFTGrant(address sender) internal {
        uint256 totalNFTs = contributions[sender] / (1 ether);
        uint256 toGrant = totalNFTs - nftsGranted[sender];
        for (uint256 i = 0; i < toGrant; i++) {
            nftsGranted[sender] += 1;
            issueNFT(sender);
        }
    }

    function issueNFT(address sender) internal {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(sender, newItemId);
    }
}
