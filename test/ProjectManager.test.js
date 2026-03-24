const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { 
  deployProjectManager, 
  createTestProject, 
  createTestIssue 
} = require("./helpers/contracts");
const { expectRevert, toEther } = require("./helpers/utils");

describe("ProjectManager", function () {
  let projectManager;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    
    const ProjectManager = await ethers.getContractFactory("ProjectManager");
    projectManager = await ProjectManager.deploy();
    await projectManager.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await projectManager.owner()).to.equal(owner.address);
    });

    it("Should start with zero projects and issues", async function () {
      expect(await projectManager.getTotalProjects()).to.equal(0);
      expect(await projectManager.getTotalIssues()).to.equal(0);
    });
  });

  describe("Project Creation", function () {
    it("Should create a new project", async function () {
      const projectName = "Test Project";
      const description = "A test project for unit testing";
      const repositoryUrl = "https://github.com/test/project";
      
      await expect(projectManager.createProject(
        projectName,
        description,
        repositoryUrl
      ))
        .to.emit(projectManager, "ProjectCreated")
        .withArgs(1, projectName, description, owner.address);

      expect(await projectManager.getTotalProjects()).to.equal(1);
      
      const project = await projectManager.getProject(1);
      expect(project.id).to.equal(1);
      expect(project.name).to.equal(projectName);
      expect(project.description).to.equal(description);
      expect(project.repositoryUrl).to.equal(repositoryUrl);
      expect(project.maintainer).to.equal(owner.address);
      expect(project.isActive).to.be.true;
      expect(project.createdAt).to.be.gt(0);
    });

    it("Should create multiple projects", async function () {
      const projectCount = 3;
      
      for (let i = 1; i <= projectCount; i++) {
        await projectManager.createProject(
          `Project ${i}`,
          `Description for project ${i}`,
          `https://github.com/test/project${i}`
        );
      }
      
      expect(await projectManager.getTotalProjects()).to.equal(projectCount);
      
      // Verify all projects exist and have correct IDs
      for (let i = 1; i <= projectCount; i++) {
        const project = await projectManager.getProject(i);
        expect(project.id).to.equal(i);
        expect(project.name).to.equal(`Project ${i}`);
      }
    });

    it("Should track maintainer projects correctly", async function () {
      // Create projects by different maintainers
      await projectManager.connect(owner).createProject(
        "Owner Project",
        "By owner",
        "https://github.com/owner/project"
      );
      
      await projectManager.connect(addr1).createProject(
        "Addr1 Project",
        "By addr1",
        "https://github.com/addr1/project"
      );
      
      await projectManager.connect(addr2).createProject(
        "Addr2 Project",
        "By addr2",
        "https://github.com/addr2/project"
      );
      
      const ownerProjects = await projectManager.getMaintainerProjects(owner.address);
      const addr1Projects = await projectManager.getMaintainerProjects(addr1.address);
      const addr2Projects = await projectManager.getMaintainerProjects(addr2.address);
      
      expect(ownerProjects.length).to.equal(1);
      expect(addr1Projects.length).to.equal(1);
      expect(addr2Projects.length).to.equal(1);
      
      expect(ownerProjects[0]).to.equal(1);
      expect(addr1Projects[0]).to.equal(2);
      expect(addr2Projects[0]).to.equal(3);
    });

    it("Should allow different users to create projects", async function () {
      await projectManager.connect(addr1).createProject(
        "User Project",
        "Created by user",
        "https://github.com/user/project"
      );
      
      expect(await projectManager.getTotalProjects()).to.equal(1);
      
      const project = await projectManager.getProject(1);
      expect(project.maintainer).to.equal(addr1.address);
      
      const maintainerProjects = await projectManager.getMaintainerProjects(addr1.address);
      expect(maintainerProjects.length).to.equal(1);
      expect(maintainerProjects[0]).to.equal(1);
    });

    it("Should handle empty project names", async function () {
      // This should work as there's no validation for empty names in the contract
      await expect(projectManager.createProject("", "Description", "https://github.com/test/project"))
        .to.not.be.reverted;
    });
  });

  describe("Issue Creation", function () {
    beforeEach(async function () {
      await projectManager.createProject(
        "Test Project",
        "A test project",
        "https://github.com/test/project"
      );
    });

    it("Should create a new issue", async function () {
      const title = "Bug Fix Needed";
      const description = "A critical bug needs to be fixed";
      const bounty = ethers.parseEther("0.1");
      
      await expect(projectManager.createIssue(
        1, // projectId
        title,
        description,
        bounty
      ))
        .to.emit(projectManager, "IssueCreated")
        .withArgs(1, 1, title, owner.address, bounty);

      expect(await projectManager.getTotalIssues()).to.equal(1);
      
      const issue = await projectManager.getIssue(1);
      expect(issue.id).to.equal(1);
      expect(issue.projectId).to.equal(1);
      expect(issue.title).to.equal(title);
      expect(issue.description).to.equal(description);
      expect(issue.creator).to.equal(owner.address);
      expect(issue.bounty).to.equal(bounty);
      expect(issue.status).to.equal(0); // IssueStatus.Open
      expect(issue.createdAt).to.be.gt(0);
      
      const projectIssues = await projectManager.getProjectIssues(1);
      expect(projectIssues.length).to.equal(1);
      expect(projectIssues[0]).to.equal(1);
    });

    it("Should create multiple issues for the same project", async function () {
      await projectManager.createIssue(1, "Issue 1", "Description 1", ethers.parseEther("0.1"));
      await projectManager.createIssue(1, "Issue 2", "Description 2", ethers.parseEther("0.2"));
      
      expect(await projectManager.getTotalIssues()).to.equal(2);
      
      const projectIssues = await projectManager.getProjectIssues(1);
      expect(projectIssues.length).to.equal(2);
    });

    it("Should create issues for different projects", async function () {
      await projectManager.createProject("Project 2", "Description 2", "https://github.com/test/project2");
      
      await projectManager.createIssue(1, "Issue for Project 1", "Description", ethers.parseEther("0.1"));
      await projectManager.createIssue(2, "Issue for Project 2", "Description", ethers.parseEther("0.2"));
      
      expect(await projectManager.getTotalIssues()).to.equal(2);
      
      const project1Issues = await projectManager.getProjectIssues(1);
      const project2Issues = await projectManager.getProjectIssues(2);
      expect(project1Issues.length).to.equal(1);
      expect(project2Issues.length).to.equal(1);
    });

    it("Should not create issue for non-existent project", async function () {
      await expect(projectManager.createIssue(
        999, // non-existent projectId
        "Test Issue",
        "Description",
        ethers.parseEther("0.1")
      )).to.be.revertedWith("Project does not exist");
    });

    it("Should handle zero bounty", async function () {
      await expect(projectManager.createIssue(
        1,
        "Free Issue",
        "No bounty needed",
        0
      )).to.not.be.reverted;
      
      const issue = await projectManager.getIssue(1);
      expect(issue.bounty).to.equal(0);
    });
  });

  describe("Issue Status Updates", function () {
    beforeEach(async function () {
      await projectManager.createProject(
        "Test Project",
        "A test project",
        "https://github.com/test/project"
      );
      await projectManager.createIssue(
        1,
        "Test Issue",
        "A test issue",
        ethers.parseEther("0.1")
      );
    });

    it("Should update issue status to InProgress", async function () {
      await expect(projectManager.updateIssueStatus(1, 1)) // IssueStatus.InProgress
        .to.emit(projectManager, "IssueStatusUpdated")
        .withArgs(1, 1);
      
      const issue = await projectManager.getIssue(1);
      expect(issue.status).to.equal(1);
    });

    it("Should update issue status to Completed", async function () {
      await projectManager.updateIssueStatus(1, 1); // InProgress
      await projectManager.updateIssueStatus(1, 2); // Completed
      
      const issue = await projectManager.getIssue(1);
      expect(issue.status).to.equal(2);
    });

    it("Should update issue status to Closed", async function () {
      await projectManager.updateIssueStatus(1, 1); // InProgress
      await projectManager.updateIssueStatus(1, 2); // Completed
      await projectManager.updateIssueStatus(1, 3); // Closed
      
      const issue = await projectManager.getIssue(1);
      expect(issue.status).to.equal(3);
    });

    it("Should not allow non-maintainer to update issue status", async function () {
      await expect(projectManager.connect(addr1).updateIssueStatus(1, 1))
        .to.be.revertedWith("Only project maintainer can perform this action");
    });

    it("Should not update status for non-existent issue", async function () {
      await expect(projectManager.updateIssueStatus(999, 1))
        .to.be.revertedWith("Issue does not exist");
    });

    it("Should allow maintainer to update status", async function () {
      // Create a project as addr1
      await projectManager.connect(addr1).createProject(
        "User Project",
        "User project",
        "https://github.com/user/project"
      );
      
      // Create an issue for that project
      await projectManager.connect(addr1).createIssue(
        2,
        "User Issue",
        "User issue",
        ethers.parseEther("0.1")
      );
      
      // addr1 should be able to update the issue status
      await expect(projectManager.connect(addr1).updateIssueStatus(2, 1))
        .to.not.be.reverted;
      
      const issue = await projectManager.getIssue(2);
      expect(issue.status).to.equal(1);
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      await projectManager.createProject("Project 1", "Description 1", "https://github.com/test/project1");
      await projectManager.createProject("Project 2", "Description 2", "https://github.com/test/project2");
      
      await projectManager.createIssue(1, "Issue 1-1", "Description", ethers.parseEther("0.1"));
      await projectManager.createIssue(1, "Issue 1-2", "Description", ethers.parseEther("0.2"));
      await projectManager.createIssue(2, "Issue 2-1", "Description", ethers.parseEther("0.3"));
    });

    it("Should get correct project details", async function () {
      const project = await projectManager.getProject(1);
      expect(project.id).to.equal(1);
      expect(project.name).to.equal("Project 1");
      expect(project.maintainer).to.equal(owner.address);
      expect(project.isActive).to.be.true;
    });

    it("Should get correct issue details", async function () {
      const issue = await projectManager.getIssue(1);
      expect(issue.id).to.equal(1);
      expect(issue.projectId).to.equal(1);
      expect(issue.title).to.equal("Issue 1-1");
      expect(issue.status).to.equal(0); // Open
    });

    it("Should get all project issues", async function () {
      const project1Issues = await projectManager.getProjectIssues(1);
      expect(project1Issues.length).to.equal(2);
      expect(project1Issues[0]).to.equal(1);
      expect(project1Issues[1]).to.equal(2);
      
      const project2Issues = await projectManager.getProjectIssues(2);
      expect(project2Issues.length).to.equal(1);
      expect(project2Issues[0]).to.equal(3);
    });

    it("Should get maintainer projects", async function () {
      const maintainerProjects = await projectManager.getMaintainerProjects(owner.address);
      expect(maintainerProjects.length).to.equal(2);
      expect(maintainerProjects[0]).to.equal(1);
      expect(maintainerProjects[1]).to.equal(2);
    });

    it("Should return correct totals", async function () {
      expect(await projectManager.getTotalProjects()).to.equal(2);
      expect(await projectManager.getTotalIssues()).to.equal(3);
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should handle project with no issues", async function () {
      await projectManager.createProject("Empty Project", "No issues", "https://github.com/test/empty");
      
      const projectIssues = await projectManager.getProjectIssues(1);
      expect(projectIssues.length).to.equal(0);
    });

    it("Should handle maintainer with no projects", async function () {
      const maintainerProjects = await projectManager.getMaintainerProjects(addr1.address);
      expect(maintainerProjects.length).to.equal(0);
    });

    it("Should not get non-existent project", async function () {
      await expect(projectManager.getProject(999))
        .to.be.revertedWith("Project does not exist");
    });

    it("Should not get non-existent issue", async function () {
      await expect(projectManager.getIssue(999))
        .to.be.revertedWith("Issue does not exist");
    });

    it("Should not get issues for non-existent project", async function () {
      await expect(projectManager.getProjectIssues(999))
        .to.be.revertedWith("Project does not exist");
    });

    it("Should update issue status through all states", async function () {
      await projectManager.createProject("Test Project", "Description", "https://github.com/test/project");
      await projectManager.createIssue(1, "Test Issue", "Description", ethers.parseEther("0.1"));
      
      // Open -> InProgress
      await projectManager.updateIssueStatus(1, 1);
      expect(await projectManager.getIssue(1)).to.have.property('status', 1);
      
      // InProgress -> Completed
      await projectManager.updateIssueStatus(1, 2);
      expect(await projectManager.getIssue(1)).to.have.property('status', 2);
      
      // Completed -> Closed
      await projectManager.updateIssueStatus(1, 3);
      expect(await projectManager.getIssue(1)).to.have.property('status', 3);
      
      // Can still update closed issues (no restriction in contract)
      await projectManager.updateIssueStatus(1, 0); // Back to Open
      expect(await projectManager.getIssue(1)).to.have.property('status', 0);
    });
  });

  describe("Complex Scenarios", function () {
    it("Should handle multiple maintainers with their own projects", async function () {
      // Owner creates project
      await projectManager.createProject("Owner Project", "Owner's project", "https://github.com/owner/project");
      
      // addr1 creates project
      await projectManager.connect(addr1).createProject("Addr1 Project", "Addr1's project", "https://github.com/addr1/project");
      
      // addr2 creates project
      await projectManager.connect(addr2).createProject("Addr2 Project", "Addr2's project", "https://github.com/addr2/project");
      
      expect(await projectManager.getTotalProjects()).to.equal(3);
      
      // Each maintainer should have their own projects
      const ownerProjects = await projectManager.getMaintainerProjects(owner.address);
      const addr1Projects = await projectManager.getMaintainerProjects(addr1.address);
      const addr2Projects = await projectManager.getMaintainerProjects(addr2.address);
      
      expect(ownerProjects.length).to.equal(1);
      expect(addr1Projects.length).to.equal(1);
      expect(addr2Projects.length).to.equal(1);
      
      expect(ownerProjects[0]).to.equal(1);
      expect(addr1Projects[0]).to.equal(2);
      expect(addr2Projects[0]).to.equal(3);
      
      // Only respective maintainers can update issues in their projects
      await projectManager.createIssue(1, "Owner Issue", "Description", ethers.parseEther("0.1"));
      await projectManager.connect(addr1).createIssue(2, "Addr1 Issue", "Description", ethers.parseEther("0.1"));
      await projectManager.connect(addr2).createIssue(3, "Addr2 Issue", "Description", ethers.parseEther("0.1"));
      
      // These should work
      await expect(projectManager.updateIssueStatus(1, 1)).to.not.be.reverted;
      await expect(projectManager.connect(addr1).updateIssueStatus(2, 1)).to.not.be.reverted;
      await expect(projectManager.connect(addr2).updateIssueStatus(3, 1)).to.not.be.reverted;
      
      // These should fail
      await expect(projectManager.connect(addr1).updateIssueStatus(1, 2))
        .to.be.revertedWith("Only project maintainer can perform this action");
      await expect(projectManager.connect(addr2).updateIssueStatus(2, 2))
        .to.be.revertedWith("Only project maintainer can perform this action");
      await expect(projectManager.updateIssueStatus(3, 2))
        .to.be.revertedWith("Only project maintainer can perform this action");
    });

    it("Should handle issue lifecycle completely", async function () {
      await projectManager.createProject("Lifecycle Project", "Testing issue lifecycle", "https://github.com/test/lifecycle");
      
      // Create multiple issues
      await projectManager.createIssue(1, "Bug Issue", "Critical bug", ethers.parseEther("0.5"));
      await projectManager.createIssue(1, "Feature Issue", "New feature request", ethers.parseEther("0.3"));
      await projectManager.createIssue(1, "Documentation Issue", "Docs need update", ethers.parseEther("0.1"));
      
      expect(await projectManager.getTotalIssues()).to.equal(3);
      
      const projectIssues = await projectManager.getProjectIssues(1);
      expect(projectIssues.length).to.equal(3);
      
      // Update issues through different statuses
      await projectManager.updateIssueStatus(1, 1); // Bug: Open -> InProgress
      await projectManager.updateIssueStatus(2, 1); // Feature: Open -> InProgress
      await projectManager.updateIssueStatus(3, 3); // Documentation: Open -> Closed
      
      // Complete the bug
      await projectManager.updateIssueStatus(1, 2); // Bug: InProgress -> Completed
      await projectManager.updateIssueStatus(1, 3); // Bug: Completed -> Closed
      
      // Check final states
      const bugIssue = await projectManager.getIssue(1);
      const featureIssue = await projectManager.getIssue(2);
      const docsIssue = await projectManager.getIssue(3);
      
      expect(bugIssue.status).to.equal(3); // Closed
      expect(featureIssue.status).to.equal(1); // InProgress
      expect(docsIssue.status).to.equal(3); // Closed
    });
  });
});
