# Azure Fundamentals — Core Concepts Quiz

**Grade:** Technical
**Subject:** Microsoft Azure
**Topic:** Azure Core Concepts and Governance
**Version:** v1.0
**Status:** Public example
**Deployment:** GitHub Pages — public demo

---

## Study Cards

### Card: Azure Regions and Availability Zones

**Front:** What is the difference between an Azure Region and an Availability Zone?
**Back:** A Region is a geographic area containing one or more datacentres. An Availability Zone is a physically separate datacentre within a region with independent power, cooling, and networking. Deploying across Availability Zones protects against single-datacentre failures. Not all regions have Availability Zones.
**Hint:** Region = geography. Availability Zone = independent building inside that geography.

### Card: Resource Groups

**Front:** What is an Azure Resource Group and what is its primary purpose?
**Back:** A Resource Group is a logical container that holds related Azure resources for a solution. It is used to manage, deploy, and control access to resources as a unit. Every resource must belong to exactly one Resource Group. Deleting a Resource Group deletes all resources inside it.
**Hint:** Think of it as a folder — but deleting the folder deletes everything in it.

### Card: Azure Subscriptions

**Front:** What is an Azure Subscription and how does it relate to billing?
**Back:** A Subscription is an agreement with Microsoft to use Azure services and the billing boundary for those services. All costs for resources within a subscription are billed together. A single Azure AD tenant can have multiple subscriptions. Subscriptions are also used as a management and access control boundary.
**Hint:** One bill = one subscription. One company can have many subscriptions.

### Card: Azure RBAC

**Front:** What is Azure Role-Based Access Control and what are the three most important built-in roles?
**Back:** RBAC is the authorisation system used to control who can do what with Azure resources. The three core built-in roles are: Owner (full access including the ability to delegate access), Contributor (full access except cannot grant access to others), and Reader (view-only access). Roles are assigned to a security principal at a specific scope.
**Hint:** Owner > Contributor > Reader. Contributor cannot manage permissions.

### Card: Azure Policy

**Front:** What does Azure Policy do and how is it different from RBAC?
**Back:** Azure Policy enforces organisational rules on resources — for example, requiring all resources to be in approved regions or mandating specific tags. RBAC controls what actions users can perform. Policy controls what resource configurations are permitted regardless of who deploys them. Both work together: RBAC governs identity, Policy governs resource state.
**Hint:** RBAC = who can act. Policy = what is allowed to exist.

### Card: Management Groups

**Front:** What is an Azure Management Group and when would you use one?
**Back:** A Management Group is a container above subscriptions that allows you to apply governance across multiple subscriptions at once. Policies and RBAC assignments at the Management Group scope are inherited by all child subscriptions. Use them when you manage multiple subscriptions and need consistent governance without repeating assignments in each subscription.
**Hint:** Management Group is above Subscription. Governance flows down the hierarchy.

### Card: Azure AD vs Azure AD Domain Services

**Front:** What is the difference between Azure Active Directory and Azure AD Domain Services?
**Back:** Azure AD is a cloud-native identity platform for authenticating users to cloud applications using modern protocols such as OAuth2, OIDC, and SAML. Azure AD DS is a managed domain service that provides legacy on-premises Active Directory features — LDAP, Kerberos, NTLM, domain join — for workloads that cannot use Azure AD directly. Azure AD DS is not a replacement for Azure AD; it is a bridge for legacy workloads.
**Hint:** Azure AD = cloud identity. Azure AD DS = legacy domain features in the cloud.

### Card: Resource Tags

**Front:** What are Azure resource tags and why are they important for cost management?
**Back:** Tags are name/value metadata pairs attached to Azure resources and Resource Groups. They do not affect resource behaviour. Common uses: cost allocation by team or project, environment identification, and automation targeting. Azure Cost Management can group and filter costs by tag.
**Hint:** Tags = sticky labels. No label = no cost visibility per team.

---

## Quiz Questions

### Q1: A support analyst needs to inspect resources and read configuration in a production subscription but must not make any changes. Which built-in role is the best fit?

**Type:** mcq
**A:** Owner
**B:** Contributor
**C:** Reader
**D:** User Access Administrator
**Answer:** C
**Explanation:** Reader provides view-only access to Azure resources and settings. Contributor and Owner allow write operations, which violates least privilege for this scenario. User Access Administrator manages permissions rather than operational resource access.
**Topic Tag:** rbac

### Q2: A platform team wants to enforce that every new resource includes a CostCentre tag and to add it automatically from the parent Resource Group when missing. What should they use?

**Type:** mcq
**A:** Azure RBAC custom role with tag permissions
**B:** Azure Policy with a Modify effect to inherit tag from Resource Group
**C:** Management Group lock settings
**D:** Azure Advisor recommendations
**Answer:** B
**Explanation:** Azure Policy with a Modify effect can append or inherit required tags at deployment and remediation time. RBAC controls who can perform actions, not resource compliance behavior. Advisor is advisory only and cannot enforce policy.
**Topic Tag:** policy

### Q3: A company has many subscriptions and wants one central place to assign policy and RBAC so all child subscriptions inherit settings. Which Azure construct should be used?

**Type:** mcq
**A:** Resource Group
**B:** Availability Zone
**C:** Management Group
**D:** Azure AD B2C directory
**Answer:** C
**Explanation:** Management Groups sit above subscriptions and support inheritance for policy and RBAC assignments. Resource Groups are below subscriptions and cannot govern multiple subscriptions centrally.
**Topic Tag:** management-groups

### Q4: Which object is the primary billing boundary in Azure?

**Type:** mcq
**A:** Azure Subscription
**B:** Resource Group
**C:** Management Group
**D:** Virtual Network
**Answer:** A
**Explanation:** A subscription is the billing and access boundary where costs are consolidated. Resource Groups and Management Groups are management constructs but not billing units.
**Topic Tag:** subscriptions

### Q5: A production Storage Account must be protected against accidental deletion, but writes must continue normally. Which lock type should be applied?

**Type:** mcq
**A:** ReadOnly lock
**B:** Delete lock
**C:** Subscription lock
**D:** CanNotDelete role assignment
**Answer:** B
**Explanation:** A Delete lock blocks deletion while still allowing reads and writes. ReadOnly blocks write operations and can disrupt application behavior.
**Topic Tag:** resource-locks

### Q6: A workload must tolerate failure of one datacentre within a single region while keeping low-latency regional traffic. What is the best deployment approach?

**Type:** mcq
**A:** Use two Resource Groups in the same region
**B:** Deploy across two Availability Zones in the same region
**C:** Deploy in one zone with autoscaling
**D:** Use only geo-redundant backup
**Answer:** B
**Explanation:** Availability Zones are physically separate datacentres in a region and are designed for intra-region datacentre fault tolerance. Resource Groups are logical and provide no physical resilience by themselves.
**Topic Tag:** availability-zones

### Q7: In disaster recovery planning, what do RTO and RPO represent?

**Type:** mcq
**A:** RTO is acceptable data loss; RPO is acceptable downtime
**B:** RTO is time to recover service; RPO is acceptable data loss point
**C:** RTO is retention period; RPO is backup size
**D:** RTO is runbook order; RPO is process owner
**Answer:** B
**Explanation:** RTO (Recovery Time Objective) is how quickly services must be restored. RPO (Recovery Point Objective) is the maximum acceptable amount of data loss measured as a point in time.
**Topic Tag:** disaster-recovery

### Q8: A business can tolerate at most 30 minutes of data loss during an outage. Which statement is correct?

**Type:** mcq
**A:** RTO must be 30 minutes or less
**B:** RPO must be 30 minutes or less
**C:** Backup retention must be 30 days
**D:** At least 30 replicas are required
**Answer:** B
**Explanation:** Data loss tolerance maps to RPO, not RTO. If the business can only lose 30 minutes of data, the solution must achieve an RPO of 30 minutes or better.
**Topic Tag:** disaster-recovery

### Q9: A user has Contributor on a Resource Group and attempts to grant another user Reader on the same scope. What is expected?

**Type:** mcq
**A:** It succeeds because Contributor can do all management tasks
**B:** It fails because Contributor cannot create role assignments
**C:** It succeeds only at subscription scope
**D:** It fails unless MFA is disabled
**Answer:** B
**Explanation:** Contributor can manage resources but cannot delegate access. Role assignment requires permissions such as Microsoft.Authorization/roleAssignments/write, available to Owner or specifically delegated identities.
**Topic Tag:** rbac

### Q10: A deny policy is assigned at Management Group scope. An Owner in a child subscription tries to deploy a disallowed resource. What happens?

**Type:** mcq
**A:** Deployment succeeds because Owner overrides policy
**B:** Deployment fails only if Reader role is also assigned
**C:** Deployment fails because policy deny applies regardless of RBAC role
**D:** Deployment succeeds but is marked non-compliant later
**Answer:** C
**Explanation:** RBAC and Policy are separate controls. RBAC authorizes actions, while Policy evaluates resource state compliance. A deny effect blocks non-compliant deployments even for Owner.
**Topic Tag:** policy

### Q11: An engineer deletes a Resource Group that contains a SQL Database, Key Vault, and App Service. No locks exist. What is the result?

**Type:** mcq
**A:** Only stateless resources are deleted
**B:** Azure asks for per-resource confirmation and keeps databases
**C:** All resources in the group are deleted
**D:** Only resources created in last 24 hours are deleted
**Answer:** C
**Explanation:** Deleting a Resource Group deletes all contained resources unless protective controls like locks are in place. This behavior is by design and is a common operational risk.
**Topic Tag:** resource-groups

### Q12: A legacy application requires LDAP and Kerberos in Azure but the team does not want to operate domain controllers. Which service best fits?

**Type:** mcq
**A:** Azure Active Directory App Registrations
**B:** Azure AD Domain Services
**C:** Azure Policy
**D:** Azure Bastion
**Answer:** B
**Explanation:** Azure AD Domain Services provides managed domain capabilities including LDAP, Kerberos, and NTLM without managing domain controller VMs.
**Topic Tag:** identity

### Q13: An architecture target requires very low RPO for a mission-critical database and continued service during regional failure. Which pattern is most appropriate?

**Type:** mcq
**A:** Single-region deployment with daily backups
**B:** Multi-zone deployment only
**C:** Cross-region replication with tested failover runbooks
**D:** Resource locks plus tagging policy
**Answer:** C
**Explanation:** Very low RPO combined with regional outage resilience typically requires cross-region replication and operationally tested failover. Zone-only designs protect against datacentre failures but not full regional outages.
**Topic Tag:** disaster-recovery

---

## Summary

- Reader is the least-privilege role for view-only operational access
- Azure Policy Modify can enforce and inherit required tags at scale
- Management Groups provide inheritance for governance across many subscriptions
- Subscriptions are the primary billing boundary in Azure
- Delete locks protect resources from accidental removal without blocking normal writes
- Availability Zones protect against datacentre failure in a single region
- RTO is recovery time target; RPO is acceptable data loss point
- Data loss tolerance requirements map directly to RPO targets
- Contributor cannot grant access to other identities
- Policy deny effects are enforced even when the deployer has Owner role
- Deleting a Resource Group removes all contained resources unless protected
- Cross-region replication is required when regional failure resilience and low RPO are both required
