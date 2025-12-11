const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VotingSystem", function () {
    let VotingSystem;
    let votingSystem;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        VotingSystem = await ethers.getContractFactory("VotingSystem");
        votingSystem = await VotingSystem.deploy();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await votingSystem.owner()).to.equal(owner.address);
        });
    });

    describe("Election Management", function () {
        it("Should allow admin to create an election", async function () {
            const now = Math.floor(Date.now() / 1000);
            await votingSystem.createElection("NACOS General Election", now, now + 86400);
            const election = await votingSystem.getElectionDetails(1);
            expect(election.name).to.equal("NACOS General Election");
        });

        it("Should allow admin to add a position", async function () {
            const now = Math.floor(Date.now() / 1000);
            await votingSystem.createElection("Test Election", now, now + 86400);
            await votingSystem.addPosition(1, "President");
            const position = await votingSystem.getPosition(1);
            expect(position.name).to.equal("President");
        });

        it("Should allow admin to add a candidate", async function () {
            const now = Math.floor(Date.now() / 1000);
            await votingSystem.createElection("Test Election", now, now + 86400);
            await votingSystem.addPosition(1, "President");
            await votingSystem.addCandidate(1, "Jane Doe", "Manifesto info", "image_url");

            const candidate = await votingSystem.getCandidate(1);
            expect(candidate.name).to.equal("Jane Doe");
        });
    });

    describe("Voting", function () {
        it("Should allow registered voter to vote", async function () {
            // Setup Election
            const now = Math.floor(Date.now() / 1000);
            await votingSystem.createElection("Test Election", now, now + 86400);
            await votingSystem.addPosition(1, "President");
            await votingSystem.addCandidate(1, "Jane Doe", "Manifesto", "url");

            // Register Voter
            await votingSystem.registerVoters([addr1.address]);

            // Cast Vote
            await votingSystem.connect(addr1).castVote(1, 1, 1); // electionId, positionId, candidateId

            // Verify Vote
            const candidate = await votingSystem.getCandidate(1);
            expect(candidate.voteCount).to.equal(1);

            expect(await votingSystem.hasVoted(addr1.address, 1)).to.equal(true);
        });

        it("Should prevent double voting", async function () {
            const now = Math.floor(Date.now() / 1000);
            await votingSystem.createElection("Test Election", now, now + 86400);
            await votingSystem.addPosition(1, "President");
            await votingSystem.addCandidate(1, "Jane Doe", "Manifesto", "url");
            await votingSystem.registerVoters([addr1.address]);

            await votingSystem.connect(addr1).castVote(1, 1, 1);

            await expect(votingSystem.connect(addr1).castVote(1, 1, 1)).to.be.revertedWith("Already voted for this position");
        });

        it("Should prevent unregistered voters from voting", async function () {
            const now = Math.floor(Date.now() / 1000);
            await votingSystem.createElection("Test Election", now, now + 86400);
            await votingSystem.addPosition(1, "President");
            await votingSystem.addCandidate(1, "Jane Doe", "Manifesto", "url");

            await expect(votingSystem.connect(addr1).castVote(1, 1, 1)).to.be.revertedWith("Not a registered voter");
        });
    });
});
