# Multi-Cloud Compute Decision Tree - Specification

**Version:** v1.0
**Date:** 2026-02-26
**Status:** Production Ready

---

## Version History

| Version | Date       | Author  | Changes         |
| ------- | ---------- | ------- | --------------- |
| v1.0    | 2026-02-26 | Initial | Initial release |

---

## What's in This Version

**Services (19):**

Azure (6):

- Azure Virtual Machines
- Azure App Service
- Azure Container Apps
- Azure Kubernetes Service (managed)
- Azure Kubernetes Service (self-managed)
- Azure Functions

AWS (6):

- Amazon EC2
- AWS Elastic Beanstalk
- AWS Fargate (ECS)
- Amazon EKS (managed)
- Amazon EKS (self-managed)
- AWS Lambda

GCP (6):

- Google Compute Engine
- Google App Engine
- Google Cloud Run
- GKE Autopilot
- GKE Standard
- Google Cloud Functions

Guidance (1):

- Help Choosing a Cloud or Service

**Decision Flow:**

- 19 questions across three parallel provider paths
- Q1 routes by cloud provider (Azure / AWS / GCP / Not sure)
- Each provider path follows: New vs Migration → Control → Architecture → Event-driven → Kubernetes complexity
- Managed Kubernetes recommended before self-managed on all three providers
- Serverless functions routed for event-driven workloads

**Styling:**

- Follows universal Decision Tree Style Guide
- IaaS = blue, PaaS = purple, FaaS = pink, Guidance = green
- Provider selection at Q1 — paths are fully independent after that

---

# Multi-Cloud Compute Decision Tree - Specification v1.0

---

## Requirements and Standards

**Reference:** See `decision-tree.rules.md` for required structure, defensive logic, navigation syntax, and validation checks. See `core/style-guide.md` for styling standards. Badge colors live in `core/badges.yml`.

### Title

**Main:** "Multi-Cloud Compute Decision Tree"
**Subtitle:** "Find the right compute service across Azure, AWS, and GCP"

---

## Decision Tree Flow

---

### Q1: Cloud Provider (id="q1")

**Title**: "Which cloud provider are you deploying to?"
**Subtitle**: "Select your target platform to get provider-specific guidance."
**Options**:

1. "Microsoft Azure" → go to q2a
2. "Amazon Web Services (AWS)" → go to q2b
3. "Google Cloud Platform (GCP)" → go to q2c
4. "I don't know / need guidance" → result: result-guidance

---

## Azure Path

### Azure Q2a: Workload Type (id="q2a")

**Title**: "Azure: New or Existing?"
**Subtitle**: "Are you building a new application or migrating an existing one?"
**Options**:

1. "New application or service" → go to q3a
2. "Migrating an existing application" → go to q3b
3. "I don't know / need guidance" → result: result-guidance

---

### Azure Q3a: Control Requirements — New (id="q3a")

**Title**: "Azure: Control Requirements"
**Subtitle**: "Do you need full control over the host operating system and environment?"
**Options**:

1. "Yes — full OS control required" → result: result-azure-vms
2. "No — a managed platform is fine" → go to q4a
3. "I don't know / need guidance" → result: result-guidance

---

### Azure Q4a: Architecture Pattern (id="q4a")

**Title**: "Azure: Architecture Pattern"
**Subtitle**: "Are you building a microservice-based or containerized architecture?"
**Options**:

1. "Yes — microservices or containers" → go to q5a
2. "No — monolithic or traditional web app" → result: result-azure-appservice
3. "I don't know / need guidance" → result: result-guidance

---

### Azure Q5a: Workload Characteristics (id="q5a")

**Title**: "Azure: Workload Characteristics"
**Subtitle**: "Is your workload event-driven with short-lived execution bursts?"
**Options**:

1. "Yes — event-driven, short-lived" → result: result-azure-functions
2. "No — long-running services" → go to q6a
3. "I don't know / need guidance" → result: result-guidance

---

### Azure Q6a: Platform Complexity (id="q6a")

**Title**: "Azure: Kubernetes or Managed Container Platform?"
**Subtitle**: "Do you need the full complexity of Kubernetes, or will a simpler managed platform work?"
**Info Box**: "**Reality check:** Most containerized workloads don't need full Kubernetes. Azure Container Apps runs on Kubernetes internally but removes cluster management entirely. Choose it unless you have a specific need for direct Kubernetes API access."
**Options**:

1. "No — simpler managed platform is fine" → result: result-azure-containerapps
2. "Yes — I need Kubernetes capabilities" → go to q7a
3. "I don't know / need guidance" → result: result-guidance

---

### Azure Q7a: Kubernetes Ownership (id="q7a")

**Title**: "Azure: Kubernetes Management Model"
**Subtitle**: "Do you want a managed Kubernetes experience or full cluster control?"
**Options**:

1. "Managed — less cluster overhead" → result: result-azure-aks-managed
2. "Full control — I'll manage the cluster myself" → result: result-azure-aks
3. "I don't know / need guidance" → result: result-guidance

---

### Azure Q3b: Migration Strategy (id="q3b")

**Title**: "Azure: Migration Strategy"
**Subtitle**: "Are you optimizing for cloud or doing a lift-and-shift migration?"
**Options**:

1. "Cloud-optimized — refactoring for cloud" → result: result-azure-appservice
2. "Lift-and-shift — minimal changes" → go to q4b
3. "I don't know / need guidance" → result: result-guidance

---

### Azure Q4b: Containerizable? (id="q4b")

**Title**: "Azure: Containerization"
**Subtitle**: "Can the existing application be containerized?"
**Options**:

1. "Yes — it can be containerized" → go to q6a
2. "No — cannot be containerized" → result: result-azure-vms
3. "I don't know / need guidance" → result: result-guidance

---

## AWS Path

### AWS Q2b: Workload Type (id="q2b")

**Title**: "AWS: New or Existing?"
**Subtitle**: "Are you building a new application or migrating an existing one?"
**Options**:

1. "New application or service" → go to q3c
2. "Migrating an existing application" → go to q3d
3. "I don't know / need guidance" → result: result-guidance

---

### AWS Q3c: Control Requirements — New (id="q3c")

**Title**: "AWS: Control Requirements"
**Subtitle**: "Do you need full control over the host operating system and environment?"
**Options**:

1. "Yes — full OS control required" → result: result-aws-ec2
2. "No — a managed platform is fine" → go to q4c
3. "I don't know / need guidance" → result: result-guidance

---

### AWS Q4c: Architecture Pattern (id="q4c")

**Title**: "AWS: Architecture Pattern"
**Subtitle**: "Are you building a microservice-based or containerized architecture?"
**Options**:

1. "Yes — microservices or containers" → go to q5b
2. "No — monolithic or traditional web app" → result: result-aws-beanstalk
3. "I don't know / need guidance" → result: result-guidance

---

### AWS Q5b: Workload Characteristics (id="q5b")

**Title**: "AWS: Workload Characteristics"
**Subtitle**: "Is your workload event-driven with short-lived execution bursts?"
**Options**:

1. "Yes — event-driven, short-lived" → result: result-aws-lambda
2. "No — long-running services" → go to q6b
3. "I don't know / need guidance" → result: result-guidance

---

### AWS Q6b: Platform Complexity (id="q6b")

**Title**: "AWS: Kubernetes or Managed Container Platform?"
**Subtitle**: "Do you need full Kubernetes, or will a managed container service work?"
**Info Box**: "**Consider Fargate first:** AWS Fargate on ECS runs containers without managing servers or clusters. It covers the majority of containerized workloads without Kubernetes complexity. Choose EKS only when you have a specific reason to need Kubernetes."
**Options**:

1. "No — managed containers without Kubernetes" → result: result-aws-fargate
2. "Yes — I need Kubernetes capabilities" → go to q7b
3. "I don't know / need guidance" → result: result-guidance

---

### AWS Q7b: Kubernetes Ownership (id="q7b")

**Title**: "AWS: Kubernetes Management Model"
**Subtitle**: "Do you want managed nodes or full cluster control?"
**Options**:

1. "Managed — use Fargate or managed node groups on EKS" → result: result-aws-eks-managed
2. "Full control — self-managed nodes" → result: result-aws-eks
3. "I don't know / need guidance" → result: result-guidance

---

### AWS Q3d: Migration Strategy (id="q3d")

**Title**: "AWS: Migration Strategy"
**Subtitle**: "Are you optimizing for cloud or doing a lift-and-shift migration?"
**Options**:

1. "Cloud-optimized — refactoring for cloud" → result: result-aws-beanstalk
2. "Lift-and-shift — minimal changes" → go to q4d
3. "I don't know / need guidance" → result: result-guidance

---

### AWS Q4d: Containerizable? (id="q4d")

**Title**: "AWS: Containerization"
**Subtitle**: "Can the existing application be containerized?"
**Options**:

1. "Yes — it can be containerized" → go to q6b
2. "No — cannot be containerized" → result: result-aws-ec2
3. "I don't know / need guidance" → result: result-guidance

---

## GCP Path

### GCP Q2c: Workload Type (id="q2c")

**Title**: "GCP: New or Existing?"
**Subtitle**: "Are you building a new application or migrating an existing one?"
**Options**:

1. "New application or service" → go to q3e
2. "Migrating an existing application" → go to q3f
3. "I don't know / need guidance" → result: result-guidance

---

### GCP Q3e: Control Requirements — New (id="q3e")

**Title**: "GCP: Control Requirements"
**Subtitle**: "Do you need full control over the host operating system and environment?"
**Options**:

1. "Yes — full OS control required" → result: result-gcp-compute
2. "No — a managed platform is fine" → go to q4e
3. "I don't know / need guidance" → result: result-guidance

---

### GCP Q4e: Architecture Pattern (id="q4e")

**Title**: "GCP: Architecture Pattern"
**Subtitle**: "Are you building a microservice-based or containerized architecture?"
**Options**:

1. "Yes — microservices or containers" → go to q5c
2. "No — monolithic or traditional web app" → result: result-gcp-appengine
3. "I don't know / need guidance" → result: result-guidance

---

### GCP Q5c: Workload Characteristics (id="q5c")

**Title**: "GCP: Workload Characteristics"
**Subtitle**: "Is your workload event-driven with short-lived execution bursts?"
**Options**:

1. "Yes — event-driven, short-lived" → result: result-gcp-functions
2. "No — long-running services" → go to q6c
3. "I don't know / need guidance" → result: result-guidance

---

### GCP Q6c: Platform Complexity (id="q6c")

**Title**: "GCP: Kubernetes or Managed Container Platform?"
**Subtitle**: "Do you need full Kubernetes, or will a serverless container platform work?"
**Info Box**: "**Cloud Run first:** Google Cloud Run is fully managed and runs any containerized workload without cluster management. It scales to zero and handles HTTP workloads with no infrastructure overhead. Choose GKE only when you have Kubernetes-specific requirements."
**Options**:

1. "No — serverless containers without Kubernetes" → result: result-gcp-cloudrun
2. "Yes — I need Kubernetes capabilities" → go to q7c
3. "I don't know / need guidance" → result: result-guidance

---

### GCP Q7c: Kubernetes Ownership (id="q7c")

**Title**: "GCP: Kubernetes Management Model"
**Subtitle**: "Do you want a fully managed Kubernetes experience or standard cluster control?"
**Options**:

1. "Managed — GKE Autopilot (Google manages nodes)" → result: result-gcp-gke-autopilot
2. "Standard — I manage nodes and configuration" → result: result-gcp-gke
3. "I don't know / need guidance" → result: result-guidance

---

### GCP Q3f: Migration Strategy (id="q3f")

**Title**: "GCP: Migration Strategy"
**Subtitle**: "Are you optimizing for cloud or doing a lift-and-shift migration?"
**Options**:

1. "Cloud-optimized — refactoring for cloud" → result: result-gcp-appengine
2. "Lift-and-shift — minimal changes" → go to q4f
3. "I don't know / need guidance" → result: result-guidance

---

### GCP Q4f: Containerizable? (id="q4f")

**Title**: "GCP: Containerization"
**Subtitle**: "Can the existing application be containerized?"
**Options**:

1. "Yes — it can be containerized" → go to q6c
2. "No — cannot be containerized" → result: result-gcp-compute
3. "I don't know / need guidance" → result: result-guidance

---

## Result Cards

---

#### 1. Use Azure Virtual Machines (result-azure-vms)

- Icon: 🖥️
- Badge: IaaS (blue #3b82f6)
- Breadcrumb: Azure VMs

**Best For:**

- Applications requiring full OS-level control and customization
- Legacy applications that cannot be containerized
- Workloads with specific kernel requirements or drivers
- Strict compliance scenarios requiring host-level isolation
- Lift-and-shift migrations with minimal refactoring

**Key Benefits:**

- Complete control over operating system, runtime, and environment
- Wide range of VM sizes optimized for compute, memory, and storage
- Support for Windows and Linux workloads
- Flexible networking and security configurations
- Persistent storage with Azure Managed Disks

**Considerations:**

- Validate regional availability, quotas, and pricing for the selected VM family
- Confirm network connectivity, identity integration, and compliance constraints

**When NOT to use:**

- Modern cloud-native applications that can use PaaS
- Stateless web applications or APIs — use App Service or Container Apps
- Containerized microservices — use Container Apps
- When you want minimal operational overhead

**Tech Tags:** Virtual Machines, IaaS, Windows, Linux, Lift-and-shift, .badge.advanced

**Responsibility Model:**

- **You manage:** OS patching, application runtime, security hardening, scaling
- **Azure manages:** Physical hardware, hypervisor, and data centre infrastructure

**Additional Considerations:**

- Review landing zone readiness, monitoring standards, and backup requirements
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://learn.microsoft.com/azure/virtual-machines/

---

#### 2. Use Azure App Service (result-azure-appservice)

- Icon: 🌐
- Badge: PaaS (purple #8b5cf6)
- Breadcrumb: Azure App Service

**Best For:**

- Web applications and RESTful APIs
- Mobile app backends
- Cloud-optimized applications in .NET, Java, Node.js, Python, PHP, or Ruby
- Teams wanting minimal infrastructure management

**Key Benefits:**

- Fully managed platform with automatic OS and framework patching
- Built-in CI/CD integration with GitHub Actions and Azure DevOps
- Auto-scaling based on demand
- Deployment slots for staging and blue-green deployments
- Custom domains and managed TLS certificates

**Considerations:**

- Verify runtime version support and regional feature availability
- Confirm identity, networking, and compliance requirements for the app

**When NOT to use:**

- Containerized microservices — use Container Apps
- Applications requiring OS-level customization — use VMs
- Event-driven short-lived workloads — use Azure Functions
- Multi-container applications needing orchestration

**Tech Tags:** .NET, Java, Node.js, Python, PaaS, CI/CD, .badge.standard

**Responsibility Model:**

- **You manage:** Application code, configuration, scaling rules, monitoring
- **Azure manages:** Infrastructure, host patching, and runtime updates

**Additional Considerations:**

- Align logging, monitoring, and alerting with platform standards
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://learn.microsoft.com/azure/app-service/

---

#### 3. Deploy Azure Container Apps (result-azure-containerapps)

- Icon: 📦
- Badge: PaaS (purple #8b5cf6)
- Breadcrumb: Container Apps

**Best For:**

- Containerized microservices without Kubernetes operational complexity
- HTTP APIs and background workers in containers
- Teams wanting container portability without cluster management
- Applications requiring scale-to-zero cost optimization

**Key Benefits:**

- Fully managed Kubernetes-based platform — no cluster to operate
- Scale to zero on idle workloads — pay only when running
- Built-in support for KEDA event-driven autoscaling and Dapr
- Traffic splitting for blue-green and canary deployments
- Supports any OCI-compliant container image

**Considerations:**

- Validate Dapr/KEDA requirements and supported scaling triggers
- Confirm network ingress, identity, and compliance constraints

**When NOT to use:**

- Direct Kubernetes API access or custom operators required — use AKS
- Specialized Kubernetes networking or privileged containers needed
- Full cluster-level customization required

**Tech Tags:** Containers, Microservices, KEDA, Dapr, PaaS, Docker, .badge.standard

**Responsibility Model:**

- **You manage:** Container images, app configuration, scaling policies
- **Azure manages:** Control plane, runtime infrastructure, and patching

**Additional Considerations:**

- Review landing zone, network integration, and container registry policies
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://learn.microsoft.com/azure/container-apps/

---

#### 4. Use Azure Kubernetes Service — Managed (result-azure-aks-managed)

- Icon: ☁️
- Badge: PaaS (purple #8b5cf6)
- Breadcrumb: AKS Managed

**Best For:**

- Teams needing Kubernetes with reduced cluster operational burden
- Applications requiring GitOps workflows or standard K8s tooling
- Workloads that outgrow Container Apps but don't need full cluster ownership
- Organizations with shared cluster governance and ownership

**Key Benefits:**

- Managed control plane — Microsoft handles Kubernetes API server
- Automatic node upgrades and security patching options
- Azure AD integration and workload identity built in
- Integration with Azure Monitor and Prometheus for observability
- Supports cluster autoscaler and node pool management

**Considerations:**

- Ensure Kubernetes platform ownership and on-call model are defined
- Validate networking, identity, and policy constraints before provisioning

**When NOT to use:**

- Container Apps meets your needs — significantly less complexity
- You need custom CNI, privileged daemonsets, or unsupported operators — use self-managed AKS
- No Kubernetes expertise in the team

**Tech Tags:** Kubernetes, AKS, GitOps, Containers, DevOps, .badge.standard

**Responsibility Model:**

- **You manage:** Node pools, app manifests, networking policies, and upgrades
- **Azure manages:** Kubernetes control plane and API server availability

**Additional Considerations:**

- Align with cluster governance, logging, and monitoring standards
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://learn.microsoft.com/azure/aks/

---

#### 5. Deploy Azure Kubernetes Service — Self-Managed (result-azure-aks)

- Icon: ⚙️
- Badge: PaaS (purple #8b5cf6)
- Breadcrumb: AKS Self-Managed

**Warning Box:**

```
⚠ Advanced — Consider Carefully

Only choose self-managed AKS when managed options (Container Apps or managed AKS)
do not meet your requirements. Operating a Kubernetes cluster requires dedicated
platform engineering expertise and carries significant ongoing operational overhead.
```

**Best For:**

- Complex workloads requiring full Kubernetes API access and custom operators
- Organizations with dedicated Kubernetes operations capability
- Workloads needing custom CNI plugins or advanced service mesh configurations
- Scenarios where managed solutions do not meet specific requirements

**Key Benefits:**

- Full control over cluster configuration, networking, and Kubernetes version
- Access to complete Kubernetes API and entire ecosystem
- Support for custom operators, CRDs, and advanced features
- Flexibility to implement any networking or service mesh model

**Considerations:**

- Ensure dedicated Kubernetes operations capacity and security hardening
- Validate custom networking and policy requirements early

**When NOT to use:**

- Standard microservices or web APIs — use Container Apps
- Teams without dedicated Kubernetes expertise
- When faster time-to-market is critical

**Tech Tags:** Kubernetes, Microservices, Custom Operators, Service Mesh, .badge.advanced

**Responsibility Model:**

- **You manage:** Cluster security, networking, upgrades, node health, and full operations
- **Azure manages:** Physical infrastructure and the control plane API availability

**Additional Considerations:**

- Review cluster lifecycle, upgrade cadence, and platform guardrails
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://learn.microsoft.com/azure/aks/

---

#### 6. Use Azure Functions (result-azure-functions)

- Icon: ⚡
- Badge: FaaS (pink #ec4899)
- Breadcrumb: Azure Functions

**Best For:**

- Event-driven workloads triggered by HTTP, queues, timers, or storage events
- Serverless APIs and webhooks
- Data processing and ETL jobs
- Scheduled automation tasks
- Sporadic or unpredictable traffic patterns

**Key Benefits:**

- True serverless — consumption-based pricing, pay only when running
- Scales automatically from zero to thousands of instances
- Rich trigger and binding ecosystem for Azure services
- Supports .NET, Java, JavaScript, Python, and PowerShell
- Integrated monitoring via Application Insights

**Considerations:**

- Validate timeout limits, cold start impact, and trigger suitability
- Confirm identity, network access, and compliance requirements

**When NOT to use:**

- Long-running processes exceeding timeout limits (default 5–10 min)
- Stateful microservices — use Container Apps
- Workloads where cold start latency is unacceptable
- Applications requiring persistent connections

**Tech Tags:** Serverless, Event-driven, .NET, JavaScript, Python, FaaS, .badge.standard

**Responsibility Model:**

- **You manage:** Function code, triggers, bindings, and monitoring
- **Azure manages:** Runtime infrastructure, scaling, and patching

**Additional Considerations:**

- Align logging, tracing, and alerting with platform standards
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://learn.microsoft.com/azure/azure-functions/

---

#### 7. Use Amazon EC2 (result-aws-ec2)

- Icon: 🖥️
- Badge: IaaS (blue #3b82f6)
- Breadcrumb: Amazon EC2

**Best For:**

- Applications requiring full OS control and custom configurations
- Legacy applications that cannot be containerized
- Workloads with specific hardware requirements (GPU, high memory)
- Lift-and-shift migrations with minimal refactoring
- Custom software stacks and licensing requirements

**Key Benefits:**

- Widest instance type selection of any cloud provider
- Complete control over OS, kernel, and runtime
- Flexible pricing: On-Demand, Reserved, Spot, and Savings Plans
- Deep VPC networking integration
- Support for Windows, Linux, and macOS workloads

**Considerations:**

- Validate instance family availability, quotas, and pricing in target regions
- Confirm networking, identity, and compliance constraints

**When NOT to use:**

- Modern cloud-native applications that suit PaaS services
- Containerized workloads — use Fargate or EKS
- Event-driven workloads — use Lambda
- When minimal operational overhead is a priority

**Tech Tags:** EC2, IaaS, Windows, Linux, Lift-and-shift, GPU, .badge.advanced

**Responsibility Model:**

- **You manage:** OS patching, application runtime, security, and scaling
- **AWS manages:** Physical hardware, hypervisor, and data centre infrastructure

**Additional Considerations:**

- Review landing zone readiness, monitoring standards, and backup requirements
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://docs.aws.amazon.com/ec2/

---

#### 8. Use AWS Elastic Beanstalk (result-aws-beanstalk)

- Icon: 🌐
- Badge: PaaS (purple #8b5cf6)
- Breadcrumb: Elastic Beanstalk

**Best For:**

- Web applications and APIs in standard runtimes
- Teams wanting PaaS simplicity without leaving AWS
- Applications in Java, .NET, Node.js, PHP, Python, Ruby, or Go
- Rapid deployment with minimal infrastructure decisions

**Key Benefits:**

- Fully managed platform with automatic capacity provisioning and load balancing
- Rolling deployments and blue-green deployment support
- Auto-scaling and health monitoring included
- Retain full access to underlying EC2 resources if needed
- Free to use — you only pay for the underlying AWS resources

**Considerations:**

- Verify runtime support, platform updates, and regional feature availability
- Confirm identity, networking, and compliance requirements

**When NOT to use:**

- Containerized microservices — use Fargate on ECS
- Event-driven workloads — use Lambda
- Applications requiring OS-level customization — use EC2
- Very large scale or complex multi-service architectures

**Tech Tags:** Java, .NET, Node.js, Python, PaaS, CI/CD, .badge.standard

**Responsibility Model:**

- **You manage:** Application code, environment configuration, and scaling policies
- **AWS manages:** Infrastructure provisioning, patching, and platform operations

**Additional Considerations:**

- Align logging, monitoring, and alerting with platform standards
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://docs.aws.amazon.com/elasticbeanstalk/

---

#### 9. Deploy AWS Fargate on ECS (result-aws-fargate)

- Icon: 📦
- Badge: PaaS (purple #8b5cf6)
- Breadcrumb: AWS Fargate

**Best For:**

- Containerized applications without cluster or server management
- Microservices and background workers in containers
- Teams wanting container portability without Kubernetes complexity
- Variable workloads benefiting from per-task billing

**Key Benefits:**

- Serverless containers — no EC2 instances to manage or patch
- Per-task CPU and memory billing — no idle capacity costs
- Deep integration with AWS services (ALB, CloudWatch, IAM, Secrets Manager)
- Built-in security with task-level IAM roles
- Works with both ECS and EKS as the compute engine

**Considerations:**

- Validate task sizing, scaling policies, and service limits
- Confirm network ingress, identity, and compliance constraints

**When NOT to use:**

- Direct Kubernetes API access required — use EKS
- Workloads needing GPU instances or Windows containers at scale
- Very high throughput workloads where EC2 Reserved pricing is more cost-effective

**Tech Tags:** Containers, Microservices, ECS, Fargate, PaaS, Docker, .badge.standard

**Responsibility Model:**

- **You manage:** Container images, task definitions, service configuration
- **AWS manages:** Underlying servers, patching, and compute infrastructure

**Additional Considerations:**

- Review landing zone, network integration, and container registry policies
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html

---

#### 10. Use Amazon EKS — Managed Node Groups (result-aws-eks-managed)

- Icon: ☁️
- Badge: PaaS (purple #8b5cf6)
- Breadcrumb: EKS Managed

**Best For:**

- Teams needing Kubernetes with reduced node operational burden
- Workloads requiring Kubernetes-native tooling and ecosystem
- Organizations standardizing on Kubernetes across providers
- Applications using Helm charts, custom operators, or Kubernetes APIs

**Key Benefits:**

- Managed control plane — AWS manages Kubernetes API server and etcd
- Managed node groups handle AMI updates and node lifecycle
- Native AWS integrations: VPC CNI, ALB Ingress, IAM roles for service accounts
- Supports Fargate profiles for serverless pods alongside EC2 nodes
- Access to full Kubernetes API and CNCF ecosystem

**Considerations:**

- Ensure Kubernetes platform ownership and on-call model are defined
- Validate networking, identity, and policy constraints before provisioning

**When NOT to use:**

- Fargate on ECS meets your needs — simpler and no Kubernetes knowledge required
- Custom CNI or unsupported node configurations needed — use self-managed EKS
- No Kubernetes expertise in the team

**Tech Tags:** Kubernetes, EKS, GitOps, Containers, Managed Nodes, .badge.standard

**Responsibility Model:**

- **You manage:** Node pool configuration, app manifests, and networking policies
- **AWS manages:** Kubernetes control plane, etcd, and API server availability

**Additional Considerations:**

- Align with cluster governance, logging, and monitoring standards
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://docs.aws.amazon.com/eks/

---

#### 11. Deploy Amazon EKS — Self-Managed (result-aws-eks)

- Icon: ⚙️
- Badge: PaaS (purple #8b5cf6)
- Breadcrumb: EKS Self-Managed

**Warning Box:**

```
⚠ Advanced — Consider Carefully

Self-managed EKS nodes give maximum flexibility but full operational
responsibility. Only choose this path when managed node groups or Fargate
do not meet your specific requirements.
```

**Best For:**

- Workloads requiring custom AMIs, kernel tuning, or non-standard node configurations
- GPU clusters or specialized hardware instance types
- Organizations with Kubernetes operations capability
- Scenarios requiring custom networking (non-VPC CNI) or privileged containers

**Key Benefits:**

- Full control over node lifecycle, AMI, and Kubernetes configuration
- Ability to run any instance type including spot, GPU, and bare metal
- Maximum flexibility for custom CNI plugins and advanced networking
- Control over Kubernetes version upgrade timing

**Considerations:**

- Ensure dedicated Kubernetes operations capacity and security hardening
- Validate custom networking and policy requirements early

**When NOT to use:**

- Standard containerized services — use Fargate or managed node groups
- Teams without Kubernetes operational expertise
- When time-to-market is critical

**Tech Tags:** Kubernetes, EKS, Self-Managed, GPU, Custom CNI, .badge.advanced

**Responsibility Model:**

- **You manage:** Node patching, AMI lifecycle, cluster security, and full operations
- **AWS manages:** Kubernetes control plane availability only

**Additional Considerations:**

- Review cluster lifecycle, upgrade cadence, and platform guardrails
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://docs.aws.amazon.com/eks/

---

#### 12. Use AWS Lambda (result-aws-lambda)

- Icon: ⚡
- Badge: FaaS (pink #ec4899)
- Breadcrumb: AWS Lambda

**Best For:**

- Event-driven workloads triggered by API Gateway, S3, SQS, SNS, or DynamoDB streams
- Serverless APIs and microservices
- Data transformation and real-time stream processing
- Scheduled tasks and automation
- Workloads with highly variable or unpredictable traffic

**Key Benefits:**

- True serverless — no infrastructure to manage
- Automatic scaling from zero to tens of thousands of concurrent executions
- Per-millisecond billing — no idle costs
- Deep integration with all AWS event sources
- Supports Node.js, Python, Java, .NET, Go, Ruby, and custom runtimes

**Considerations:**

- Validate timeout limits, cold start impact, and event source suitability
- Confirm identity, network access, and compliance requirements

**When NOT to use:**

- Long-running processes (maximum 15 minutes)
- Stateful applications requiring persistent connections
- Workloads where cold start latency is unacceptable
- Applications needing more than 10 GB memory or 6 vCPUs

**Tech Tags:** Serverless, Event-driven, Lambda, FaaS, Python, Node.js, .badge.standard

**Responsibility Model:**

- **You manage:** Function code, memory/timeout configuration, IAM permissions
- **AWS manages:** Runtime infrastructure, scaling, and patching

**Additional Considerations:**

- Align logging, tracing, and alerting with platform standards
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://docs.aws.amazon.com/lambda/

---

#### 13. Use Google Compute Engine (result-gcp-compute)

- Icon: 🖥️
- Badge: IaaS (blue #3b82f6)
- Breadcrumb: Compute Engine

**Best For:**

- Applications requiring full OS control and custom environments
- Legacy applications that cannot be containerized
- High-performance computing, GPU, and specialized workloads
- Lift-and-shift migrations from on-premises
- Custom software stacks or licensing requirements

**Key Benefits:**

- Widest machine type selection including custom machine types
- Per-second billing with committed use discounts
- Live migration for maintenance with no downtime
- Deep VPC and networking integration
- Preemptible and Spot VMs for cost optimization

**Considerations:**

- Validate machine family availability, quotas, and pricing in target regions
- Confirm networking, identity, and compliance constraints

**When NOT to use:**

- Cloud-native applications suited to PaaS services
- Containerized workloads — use Cloud Run or GKE
- Event-driven workloads — use Cloud Functions
- When minimal operational overhead is a priority

**Tech Tags:** Compute Engine, IaaS, Linux, Windows, GPU, Lift-and-shift, .badge.advanced

**Responsibility Model:**

- **You manage:** OS patching, application runtime, security, and scaling
- **Google manages:** Physical hardware, hypervisor, and data centre infrastructure

**Additional Considerations:**

- Review landing zone readiness, monitoring standards, and backup requirements
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://cloud.google.com/compute/docs

---

#### 14. Use Google Cloud Functions (result-gcp-functions)

- Icon: ⚡
- Badge: FaaS (pink #ec4899)
- Breadcrumb: Cloud Functions

**Best For:**

- Event-driven workloads triggered by HTTP, Pub/Sub, Cloud Storage, or Firestore events
- Serverless APIs, webhooks, and lightweight integrations
- Data transformation, ETL pipelines, and real-time stream processing
- Scheduled automation tasks via Cloud Scheduler
- Sporadic or unpredictable traffic patterns

**Key Benefits:**

- True serverless — no infrastructure to manage
- Automatic scaling from zero to thousands of instances
- Per-100ms billing — no idle costs
- Deep integration with Google Cloud events and Pub/Sub
- Supports Node.js, Python, Go, Java, .NET, Ruby, and PHP
- Cloud Functions 2nd gen built on Cloud Run — longer timeouts, larger instances

**Considerations:**

- Validate timeout limits, cold start impact, and event source suitability
- Confirm identity, network access, and compliance requirements

**When NOT to use:**

- Long-running processes exceeding timeout limits (1st gen: 9 min, 2nd gen: 60 min)
- Stateful microservices requiring persistent connections — use Cloud Run
- Workloads where cold start latency is unacceptable
- Complex multi-step orchestration — consider Cloud Run or GKE

**Tech Tags:** Serverless, Event-driven, Cloud Functions, FaaS, Python, Node.js, .badge.standard

**Responsibility Model:**

- **You manage:** Function code, triggers, memory/timeout configuration
- **Google manages:** Runtime infrastructure, scaling, and patching

**Additional Considerations:**

- Align logging, tracing, and alerting with platform standards
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://cloud.google.com/functions/docs

---

#### 15. Use Google App Engine (result-gcp-appengine)

- Icon: 🌐
- Badge: PaaS (purple #8b5cf6)
- Breadcrumb: App Engine

**Best For:**

- Web applications and HTTP APIs in standard runtimes
- Teams wanting fully managed infrastructure with minimal configuration
- Applications in Node.js, Python, Java, Go, PHP, or Ruby
- Workloads benefiting from automatic scaling and traffic splitting

**Key Benefits:**

- Fully managed — no servers, no containers to manage
- Automatic scaling based on traffic with scale-to-zero in Standard environment
- Built-in versioning and traffic splitting for A/B testing
- Integrated with Cloud Monitoring, Logging, and Error Reporting
- Standard environment for fast cold starts; Flexible environment for custom runtimes

**Considerations:**

- Verify runtime support, scaling model, and regional feature availability
- Confirm identity, networking, and compliance requirements

**When NOT to use:**

- Containerized microservices — use Cloud Run
- Event-driven workloads — use Cloud Functions
- Applications requiring OS customization — use Compute Engine
- Workloads needing fine-grained container control

**Tech Tags:** App Engine, PaaS, Node.js, Python, Java, Go, .badge.standard

**Responsibility Model:**

- **You manage:** Application code, configuration, and version management
- **Google manages:** Infrastructure, runtime, scaling, and patching

**Additional Considerations:**

- Align logging, monitoring, and alerting with platform standards
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://cloud.google.com/appengine/docs

---

#### 16. Deploy Google Cloud Run (result-gcp-cloudrun)

- Icon: 📦
- Badge: PaaS (purple #8b5cf6)
- Breadcrumb: Cloud Run

**Best For:**

- Containerized HTTP services without infrastructure management
- Microservices and APIs in containers
- Teams wanting container portability without Kubernetes overhead
- Variable workloads — scale to zero when idle

**Key Benefits:**

- Fully managed — deploy any container, no cluster to operate
- Scale to zero — pay only when requests are being handled
- Request-based and CPU-always-on billing models
- Supports gRPC, HTTP/2, and WebSockets
- Integrated with Cloud Build for CI/CD and Artifact Registry for images
- Cloud Run Jobs for batch and scheduled workloads

**Considerations:**

- Validate request timeout limits and non-HTTP workload fit
- Confirm network ingress, identity, and compliance constraints

**When NOT to use:**

- Kubernetes-specific features required — use GKE
- Non-HTTP workloads needing full orchestration — use GKE
- Very long-running processes exceeding timeout limits

**Tech Tags:** Containers, Cloud Run, PaaS, Docker, Microservices, Serverless, .badge.standard

**Responsibility Model:**

- **You manage:** Container images, service configuration, and scaling settings
- **Google manages:** Infrastructure, runtime, and auto-scaling

**Additional Considerations:**

- Review landing zone, network integration, and container registry policies
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://cloud.google.com/run/docs

---

#### 17. Use GKE Autopilot (result-gcp-gke-autopilot)

- Icon: ☁️
- Badge: PaaS (purple #8b5cf6)
- Breadcrumb: GKE Autopilot

**Best For:**

- Teams needing Kubernetes with minimal node management
- Workloads requiring Kubernetes-native tooling without cluster operations
- Organizations standardizing on Kubernetes across providers
- Applications using Helm, Kubernetes APIs, or custom operators

**Key Benefits:**

- Google manages nodes, node pools, and cluster infrastructure
- Pay only for pod resource requests — no idle node costs
- Automatic security hardening and compliance with CIS benchmarks
- Full Kubernetes API compatibility with standard tooling
- Automatic node scaling, upgrades, and repair

**Considerations:**

- Ensure Kubernetes platform ownership and on-call model are defined
- Validate networking, identity, and policy constraints before provisioning

**When NOT to use:**

- Cloud Run meets your needs — significantly simpler
- Privileged containers or custom node configurations required — use GKE Standard
- No Kubernetes expertise in the team

**Tech Tags:** Kubernetes, GKE, Autopilot, GitOps, Containers, .badge.standard

**Responsibility Model:**

- **You manage:** Kubernetes workloads, manifests, and application configuration
- **Google manages:** Nodes, node pools, cluster security, and infrastructure

**Additional Considerations:**

- Align with cluster governance, logging, and monitoring standards
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://cloud.google.com/kubernetes-engine/docs/concepts/autopilot-overview

---

#### 18. Deploy GKE Standard (result-gcp-gke)

- Icon: ⚙️
- Badge: PaaS (purple #8b5cf6)
- Breadcrumb: GKE Standard

**Warning Box:**

```
⚠ Advanced — Consider Carefully

GKE Standard gives full control over node configuration and cluster operations.
Only choose this over Autopilot when you have specific requirements that Autopilot
cannot satisfy — Autopilot covers the majority of workloads with significantly
less operational overhead.
```

**Best For:**

- Workloads requiring custom node images, GPU instances, or specialized hardware
- Applications needing privileged containers or custom kernel parameters
- Organizations with dedicated Kubernetes platform engineering teams
- Advanced networking requirements with custom CNI plugins

**Key Benefits:**

- Full control over node pool configuration, machine types, and autoscaling
- Support for GPU and TPU node pools for ML workloads
- Advanced networking with Alias IPs, VPC-native clusters, and custom CNI
- Access to node-level debugging and custom daemonsets

**Considerations:**

- Ensure dedicated Kubernetes operations capacity and security hardening
- Validate custom networking and policy requirements early

**When NOT to use:**

- GKE Autopilot or Cloud Run meets your needs
- Teams without Kubernetes operations expertise
- Standard containerized HTTP services

**Tech Tags:** Kubernetes, GKE, Standard, GPU, TPU, Custom CNI, .badge.advanced

**Responsibility Model:**

- **You manage:** Node pools, OS configuration, cluster upgrades, and full operations
- **Google manages:** Kubernetes control plane availability

**Additional Considerations:**

- Review cluster lifecycle, upgrade cadence, and platform guardrails
- Confirm operational ownership, support model, and escalation path

**Contact:**

- contact@example.com

**Docs:** https://cloud.google.com/kubernetes-engine/docs

---

#### 19. Get Help Choosing Your Cloud and Compute Service (result-guidance)

- Icon: 🧭
- Badge: Standard (green #10b981)
- Breadcrumb: Get Guidance

**Overview:** "Use this path if you are unsure which cloud provider or compute service fits your workload. Getting the compute decision right early prevents costly migrations later."

**Best For:**

- Teams early in cloud adoption or evaluating providers for the first time
- Workloads with unclear ownership, compliance constraints, or multi-cloud requirements
- Organizations without an established cloud strategy or governance model

**Key Benefits:**

- Alignment on provider strengths before committing
- Avoids lock-in decisions made without full context
- Surfaces compliance, data residency, and cost factors early

**Considerations:**

- What does the workload do — web, batch, event-driven, ML?
- Are there data residency or compliance requirements?
- Is there an existing cloud provider relationship or agreement?
- What is the team's existing operational expertise?

**When NOT to use:**

- You already have a cloud provider mandate or agreement
- A current service owner has provided an approved architecture blueprint

**Tech Tags:** Guidance, Multi-cloud, Architecture, Discovery, .badge.urgent

**Responsibility Model:**

- **You manage:** Requirements, constraints, and decision inputs
- **Decision owners manage:** Provider evaluation and service selection

**Additional Considerations:**

- Confirm stakeholder availability and decision timelines before engagement
- Bring existing diagrams, constraints, and cost assumptions to speed evaluation

**Contact:**

- contact@example.com

---

## Progress Steps

```javascript
const progressSteps = {
  q1: 0,
  q2a: 16,
  q2b: 16,
  q2c: 16,
  q3a: 32,
  q3b: 32,
  q3c: 32,
  q3d: 32,
  q3e: 32,
  q3f: 32,
  q4a: 48,
  q4b: 48,
  q4c: 48,
  q4d: 48,
  q4e: 48,
  q4f: 48,
  q5a: 64,
  q5b: 64,
  q5c: 64,
  q6a: 80,
  q6b: 80,
  q6c: 80,
  q7a: 80,
  q7b: 80,
  q7c: 80,
  result: 100,
};
```

---

## Key Messages

### IaaS (VMs)

- **When:** Full OS control, legacy apps, lift-and-shift, specialized hardware
- **Tradeoff:** Maximum control, maximum operational responsibility
- **All three providers offer comparable IaaS** — choice often driven by existing tooling or agreements

### PaaS Web (App Service / Beanstalk / App Engine)

- **When:** Traditional web apps and APIs, standard runtimes, minimal infrastructure decisions
- **Tradeoff:** Less control, significantly less operational overhead
- **Best for teams** who want to focus on code, not infrastructure

### Managed Containers (Container Apps / Fargate / Cloud Run)

- **Default recommendation** for containerized workloads
- **No cluster management** — the biggest advantage over Kubernetes
- **Scale to zero** — cost-effective for variable workloads

### Managed Kubernetes (AKS managed / EKS managed node groups / GKE Autopilot)

- **When:** Kubernetes-specific tooling required — operators, custom CRDs, Helm at scale
- **Choose managed over self-managed** unless you have specific reasons not to
- **Requires Kubernetes expertise** in the team regardless of management model

### Self-Managed Kubernetes (AKS / EKS self-managed / GKE Standard)

- **Last resort** — only when managed options genuinely cannot meet requirements
- **High operational burden** — cluster security, upgrades, and node lifecycle are your responsibility
- **Requires dedicated platform engineering** capacity

### FaaS (Functions / Lambda / Cloud Functions)

- **When:** Event-driven, short-lived, consumption-based billing needed
- **Not for:** Long-running processes, stateful services, latency-sensitive paths
- **Cost advantage** for sporadic or unpredictable traffic

---

END OF SPECIFICATION v1.0
