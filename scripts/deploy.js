const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const VotingSystem = await hre.ethers.getContractFactory("VotingSystem");
    console.log("Deploying new contract...");
    const votingSystem = await VotingSystem.deploy();
    await votingSystem.waitForDeployment();
    const address = await votingSystem.getAddress();
    console.log("VotingSystem deployed to:", address);

    // Update Config
    const configPath = path.join(__dirname, "../src/utils/contract-config.js");
    fs.writeFileSync(configPath, `export const CONTRACT_ADDRESS = "${address}";\n`);
    console.log("Contract address saved to src/utils/contract-config.js");

    // Seed Data
    console.log("--- Seeding Data ---");
    const now = Math.floor(Date.now() / 1000);
    const oneDay = 86400;

    // 1. Create Election
    console.log("Creating Election: NACOSS General Elections 2024");
    await (await votingSystem.createElection("NACOSS General Elections 2024", now - 60, now + oneDay)).wait();

    // 2. Add Positions
    console.log("Adding Position: President");
    await (await votingSystem.addPosition(1, "President")).wait();
    console.log("Adding Position: Director of Socials");
    await (await votingSystem.addPosition(1, "Director of Socials")).wait();

    // 3. Add Candidates
    console.log("Adding Candidate: Sarah Connor (President)");
    await (await votingSystem.addCandidate(
        1, "Sarah Connor", "Building a safer future for all students.",
        "https://ui-avatars.com/api/?name=Sarah+Connor&background=0D8ABC&color=fff&size=200"
    )).wait();

    console.log("Adding Candidate: John Wick (President)");
    await (await votingSystem.addCandidate(
        1, "John Wick", "Focus, Commitment, and Sheer Will.",
        "https://ui-avatars.com/api/?name=John+Wick&background=333&color=fff&size=200"
    )).wait();

    console.log("Adding Candidate: Tony Stark (Socials)");
    await (await votingSystem.addCandidate(
        2, "Tony Stark", "Party at the Tower!",
        "https://ui-avatars.com/api/?name=Tony+Stark&background=FF5733&color=fff&size=200"
    )).wait();

    console.log("--- Deployment & Seeding Complete ---");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
