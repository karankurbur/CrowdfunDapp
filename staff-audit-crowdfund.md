https://github.com/Hacker-DAO/student.karankurbur

The following is a micro audit of git commit 2b925d8dbbf9aeb1c773014d494f9b80b4043e44 by Gilbert.

## Design Exercise

I don't think the first implementation proxy pattern suggestion would work – at least, not very cleanly. The three NFT addresses would need to each have its own storage slots (otherwise, minting one address would be minting for all three). Because of this you would need to deploy three separately coded NFT contracts, each with storage "off limits" placeholders to avoid stepping on each others' toes – as well as the storage for the crowdfundr project itself.

It's usually better to take an all-or-nothing approach to proxies, rather than spreading logic between the base and delegated contract. The reason for *implementing* a proxy – outside of upgradability – is primarily for reducing new contract deployment costs. See the "minimal proxy" pattern for more info.

ERC-1155 is a good approach.


## issue-1

**[High]** Owner cannot withdraw after 30 days

The `isTimeLimitNotOver` modifier on `ownerWithdraw` disallows an owner to withdraw contributed funds if the current timestamp is past the initial 30 day limit.

Consider removing this modifier to allow the owner to withdraw anytime the goal is met.


## issue-2

**[Medium]** Funds can get stuck in contract

In Crowdfundr.sol, the `goalMet` function checks `totalContributions > goal`. However, line 137 sets `completed` to true if `totalContributions >= goal`. This allows a situation where the project considered complete yet has not met its goal, preventing both the owner from withdrawing and people from contributing.

Consider changing `>` to `>=` in `goalMet`. Also consider reducing `isGoalMet`/`isGoalNotMet` and `completed` to a single source of truth.


## issue-3

**[Code Quality]** Unnecessary nonReentrant guards

The use of nonReentrant in Project.sol:108 and 122 are not necessary. The one for `contribute` can be removed by moving the `if` block on line 137 to be above `handleNFTGrant()` on line 136.


## issue-4

**[Code Quality]** Unnecessary import

Crowdfundr.sol:5 imports but does not use Ownable.sol.


## issue-5

**[Code Quality]** Unnecessary use of Counters

The use of OZ's `Counters` contract is not necessary. Simply use a `uint` and increment it.



## Nitpicks

- `timeLimit` and `minContribution` should be made constants and cased `TIME_LIMIT` and `MIN_CONTRIBUTION` to avoid read/write storage costs.


## Score

| Reason | Score |
|-|-|
| Late                       | - |
| Unfinished features        | - |
| Extra features             | - |
| Vulnerability              | 5 |
| Unanswered design exercise | - |

Total: 5
Good job!
