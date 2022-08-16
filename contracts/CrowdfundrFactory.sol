//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Crowdfundr.sol";

contract CrowdfundrFactory {

    address[] public createdInstances;

    function createInstance(uint ethGoal) public {
        // Design decision to expect non-technical users to pass in ETH units
        uint goal = ethGoal * 1 ether;
        Crowdfundr crowdfundr = new Crowdfundr(msg.sender, goal);
        createdInstances.push(address(crowdfundr));
    }

    function getCreatedContractByIndex(uint index) public view returns (address) {
        return createdInstances[index];
    }
}
