Design Question Answers
- We can use the implementation proxy pattern to deploy 3 contracts but without including any NFT logic inside of our
  crowdfundr contract. We would deploy an NFT contract once and use this as the implementation contract that would
  execute our logic while keeping the state inside of our crowdfundr contract. This reduces the total size of our
  contract since it contains no NFT-specific logic. We would only need to store three addresses and a function to 
  forward NFT related calls to the implementation address using delegatecall. We can follow this same pattern for any
  libraries that we are using inside our crowdfundr contract. 
- We could also use the ERC1155 standard to deploy one NFT contract and create three different tokens inside of it to
  represent the different contribution tiers. We would need to include the logic for the ERC1155 contract inside of our
  crowdfundr contract. 
- We could also combine the two solutions above to only deploy one contract that contains minimal logic inside our
  crowdfundr contract.


- The smart contract is reusable; multiple projects can be registered and accept ETH concurrently.
    - Specifically, you should use the factory contract pattern.
- The goal is a preset amount of ETH.
    - This cannot be changed after a project gets created.
- Regarding contributing:
    - The contribute amount must be at least 0.01 ETH.
    - There is no upper limit.
    - Anyone can contribute to the project, including the creator.
    - One address can contribute as many times as they like.
    - No one can withdraw their funds until the project either fails or gets cancelled.
- Regarding contributer badges:
    - An address receives a badge if their **total contribution** is at least 1 ETH.
    - One address can receive multiple badges, but should only receive 1 badge per 1 ETH.
- If the project is not fully funded within 30 days:
    - The project goal is considered to have failed.
    - No one can contribute anymore.
    - Supporters get their money back.
    - Contributor badges are left alone. They should still be tradable.
- Once a project becomes fully funded:
    - No one else can contribute (however, the last contribution can go over the goal).
    - The creator can withdraw any amount of contributed funds.
- The creator can choose to cancel their project before the 30 days are over, which has the same effect as a project failing.


# Basic Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, a sample script that deploys that contract, and an example of a task implementation, which simply lists the available accounts.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
node scripts/sample-script.js
npx hardhat help
```
