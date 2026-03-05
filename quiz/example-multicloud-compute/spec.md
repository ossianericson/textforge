# Multi-Cloud Compute — Which Service to Use? (Quiz)

**Grade:** Technical
**Subject:** Cloud Architecture
**Topic:** Multi-Cloud Compute Service Selection
**Version:** v1.0

---

## Study Cards

### Card: The IaaS Tier — Azure VMs / Amazon EC2 / Google Compute Engine

**Front:** What is the single most important reason to choose IaaS (VMs) over any PaaS or serverless option?
**Back:** Full OS control. Choose IaaS when you need to configure the operating system, install specific drivers or agents, run software that cannot be containerized, or perform a lift-and-shift migration with minimal code changes. The trade-off is that you own OS patching, security hardening, and runtime management.
**Hint:** If you're asking "can I touch the OS?" — IaaS is the answer when the answer is yes.

### Card: PaaS Web Tier — App Service / Elastic Beanstalk / App Engine

**Front:** What type of workload are App Service, Elastic Beanstalk, and App Engine all designed for, and what do they have in common?
**Back:** All three are PaaS platforms for traditional web applications and REST APIs. They manage the OS and runtime — you deploy application code only. Ideal for monolithic or traditional web apps that don't need containers. Best when the team wants to focus on code, not infrastructure.
**Hint:** Web app, managed runtime, zero OS ownership — that's the PaaS web tier.

### Card: Managed Containers — Container Apps / Fargate / Cloud Run

**Front:** What is the key shared advantage of Azure Container Apps, AWS Fargate, and Google Cloud Run compared to Kubernetes?
**Back:** No cluster to manage. All three run containers on fully managed infrastructure — you never touch a node pool or control plane. They support scale-to-zero, making them cost-effective for variable workloads. They are the default recommendation for containerized workloads unless you have a specific need for Kubernetes.
**Hint:** Containers without the Kubernetes complexity tax.

### Card: Managed Kubernetes — AKS Managed / EKS Managed / GKE Autopilot

**Front:** When should you choose managed Kubernetes (AKS managed, EKS managed node groups, GKE Autopilot) over the serverless container tier?
**Back:** When you need Kubernetes-specific capabilities — custom operators, CRDs, Helm at scale, GitOps workflows, or Kubernetes-native tooling — but do not want to own node pool lifecycle or control plane operations. Managed Kubernetes is always preferred over self-managed unless specific requirements make it impossible.
**Hint:** Kubernetes tooling, but someone else manages the nodes.

### Card: Self-Managed Kubernetes — AKS / EKS / GKE Standard

**Front:** What two conditions must both be true before choosing self-managed Kubernetes (AKS self-managed, EKS self-managed, GKE Standard)?
**Back:** (1) You have a specific requirement that managed Kubernetes cannot satisfy — custom CNI plugins, privileged containers, custom node images, GPU/TPU hardware, or node-level debugging. (2) You have dedicated platform engineering capacity to own cluster security, upgrades, and operations. If either condition is false, use managed Kubernetes.
**Hint:** Self-managed = last resort + dedicated ops team.

### Card: FaaS Tier — Azure Functions / AWS Lambda / Google Cloud Functions

**Front:** What are the two workload characteristics that make FaaS (Functions / Lambda / Cloud Functions) the right choice?
**Back:** (1) Event-driven — triggered by a queue, HTTP call, timer, storage event, or messaging service. (2) Short-lived — execution completes within the platform's timeout limit. FaaS scales to zero between events, giving a consumption-based cost model ideal for sporadic or unpredictable traffic. Long-running, stateful, or latency-sensitive workloads are poor fits.
**Hint:** Event triggers + short execution = FaaS. Everything else, don't.

### Card: AWS Fargate vs Amazon EKS

**Front:** What is the AWS equivalent of Azure Container Apps, and when does it give way to Amazon EKS?
**Back:** AWS Fargate on ECS. It runs containers without servers or clusters, handles the majority of containerized workloads, and is the AWS default recommendation before considering EKS. Move to EKS when you need Kubernetes-specific capabilities — operators, CRDs, cluster-level networking, or cross-provider Kubernetes standardization.
**Hint:** Fargate first on AWS, EKS only when Kubernetes is genuinely needed.

### Card: GKE Autopilot vs GKE Standard

**Front:** What is the difference in responsibility between GKE Autopilot and GKE Standard?
**Back:** GKE Autopilot: Google manages nodes, node pools, security hardening, and scaling — you manage only Kubernetes workloads and manifests. GKE Standard: you manage node pools, machine types, OS configuration, and cluster upgrades — Google manages only the control plane. GKE Standard is for advanced requirements like GPU/TPU nodes, custom CNI, or privileged containers. Autopilot covers the majority of workloads.
**Hint:** Autopilot = Google owns nodes. Standard = you own nodes.

### Card: Lift-and-Shift vs Cloud-Optimized Migration

**Front:** When migrating an existing application, what determines whether you choose IaaS (VMs) or PaaS?
**Back:** Whether the application can be containerized and whether the team is willing to refactor. Lift-and-shift with minimal changes → IaaS (Azure VMs / EC2 / GCE). Can be containerized → move to the container tier. Cloud-optimized refactoring → PaaS web tier (App Service / Beanstalk / App Engine). The decision tree applies the same logic across all three providers.
**Hint:** Refactor = PaaS. Containerize = container tier. Touch nothing = VM.

---

## Quiz Questions

### Q1: A team is migrating a Windows Server 2012 application to Azure. The app uses COM+ components registered in the OS registry and cannot be containerized. Which service is correct?

**Type:** mcq
**A:** Azure App Service
**B:** Azure Container Apps
**C:** Azure Functions
**D:** Azure Virtual Machines
**Answer:** D
**Explanation:** COM+ components require OS-level registration — only Azure VMs give you full OS control to support this. App Service and Container Apps are PaaS and do not expose OS internals. The workload cannot be containerized, which rules out the container tier entirely.
**Topic Tag:** iaas

### Q2: A startup is building a new REST API in Node.js on AWS. The team has no infrastructure engineers, traffic is predictable at around 300 requests per minute during business hours, and they want zero server management. What is the best fit?

**Type:** mcq
**A:** Amazon EC2
**B:** Amazon EKS (self-managed)
**C:** AWS Elastic Beanstalk
**D:** AWS Fargate
**Answer:** C
**Explanation:** Elastic Beanstalk is AWS's PaaS web platform — you deploy application code, and AWS manages the OS, runtime, and scaling. It is the AWS equivalent of Azure App Service. EC2 requires infrastructure management. Fargate runs containers, adding complexity the team does not need for a simple REST API. Self-managed EKS is the wrong answer for any scenario requiring zero infrastructure overhead.
**Topic Tag:** paas-web

### Q3: A GCP team wants to deploy a containerised HTTP microservice. They do not want to manage a Kubernetes cluster. Traffic is variable and drops to near-zero overnight. What is the recommended service?

**Type:** mcq
**A:** Google App Engine
**B:** GKE Standard
**C:** Google Compute Engine
**D:** Google Cloud Run
**Answer:** D
**Explanation:** Cloud Run is GCP's fully managed container platform — no cluster to operate, supports scale-to-zero, and handles HTTP workloads natively. GKE Standard requires full cluster management. App Engine is for traditional web apps, not containerised microservices. GCE is IaaS and requires OS management.
**Topic Tag:** managed-containers

### Q4: An architecture team is evaluating compute services for a new Azure workload. The workload processes messages from a Service Bus queue, each job takes around 20 seconds, and volume is unpredictable — quiet for hours, then bursting to 500 messages. Which service fits best?

**Type:** mcq
**A:** Azure App Service
**B:** Azure Virtual Machines
**C:** Azure Functions
**D:** Azure Container Apps
**Answer:** C
**Explanation:** Azure Functions with a Service Bus trigger is purpose-built for this pattern. The 20-second execution is within the timeout limit, the consumption plan handles burst-and-quiet traffic efficiently and scales to zero during quiet periods. App Service bills for reserved capacity regardless of traffic. Container Apps could work but adds unnecessary complexity for a simple event-driven job.
**Topic Tag:** faas

### Q5: A team running 15 microservices on AWS needs Kubernetes-native GitOps workflows and Helm chart deployments across services. They have a dedicated platform team. They want managed nodes to reduce operational overhead. What is the correct service?

**Type:** mcq
**A:** AWS Fargate on ECS
**B:** AWS Elastic Beanstalk
**C:** Amazon EKS with managed node groups
**D:** Amazon EKS self-managed
**Answer:** C
**Explanation:** Managed node groups on EKS give the team full Kubernetes API access for GitOps and Helm, while AWS manages the underlying node lifecycle. Self-managed EKS would add node upgrade and security overhead without benefit here. Fargate does not support the full Kubernetes tooling required. Beanstalk is a PaaS platform, not a Kubernetes environment.
**Topic Tag:** managed-kubernetes

### Q6: A GCP workload requires GPU node pools for ML inference and custom daemonsets for specialised hardware monitoring agents. Which service is required?

**Type:** mcq
**A:** Google Cloud Run
**B:** Google App Engine
**C:** GKE Autopilot
**D:** GKE Standard
**Answer:** D
**Explanation:** GPU node pools and custom daemonsets require node-level control — only GKE Standard provides this. GKE Autopilot manages nodes on your behalf and does not support privileged containers, custom node images, or custom daemonsets. Cloud Run is serverless. App Engine is a PaaS web platform.
**Topic Tag:** self-managed-kubernetes

### Q7: Which of the following is the correct AWS equivalent of Azure Container Apps?

**Type:** mcq
**A:** Amazon EC2
**B:** AWS Lambda
**C:** AWS Elastic Beanstalk
**D:** AWS Fargate on ECS
**Answer:** D
**Explanation:** AWS Fargate on ECS is the managed serverless container platform equivalent to Azure Container Apps — containers run without managing servers or clusters, with no Kubernetes required. Lambda is FaaS (event-driven, short-lived). Beanstalk is PaaS for web apps. EC2 is IaaS.
**Topic Tag:** managed-containers

### Q8: A team is migrating an existing application to GCP. They want to refactor it for cloud and host it as a traditional web application in Python. They do not want to containerize it. What is the right service?

**Type:** mcq
**A:** Google Cloud Run
**B:** Google Cloud Functions
**C:** GKE Autopilot
**D:** Google App Engine
**Answer:** D
**Explanation:** App Engine is GCP's PaaS web platform for traditional applications — Python is a supported runtime, and it requires no containerization or infrastructure management. Cloud Run requires a container image. Cloud Functions is FaaS for event-driven workloads. GKE Autopilot is Kubernetes and is far too complex for a straightforward web application migration.
**Topic Tag:** paas-web

### Q9: What is the correct order of preference when choosing a container platform on any of the three cloud providers, from least to most complex?

**Type:** mcq
**A:** Serverless containers → Managed Kubernetes → Self-managed Kubernetes
**B:** Self-managed Kubernetes → Managed Kubernetes → Serverless containers
**C:** Managed Kubernetes → Serverless containers → Self-managed Kubernetes
**D:** Serverless containers → Self-managed Kubernetes → Managed Kubernetes
**Answer:** A
**Explanation:** The decision tree applies the same preference hierarchy across all three providers: try serverless containers first (Container Apps / Fargate / Cloud Run) — no cluster management. If Kubernetes tooling is genuinely needed, use managed Kubernetes. Only fall back to self-managed Kubernetes when managed options cannot meet a specific requirement.
**Topic Tag:** architecture-pattern

### Q10: A team needs to deploy a containerized microservice on Azure. Their architect suggests self-managed AKS. Under what condition is this the correct recommendation?

**Type:** mcq
**A:** The team wants GitOps workflows and Helm chart deployments
**B:** The workload requires a custom CNI plugin and the team has dedicated Kubernetes engineers
**C:** The workload processes events from Event Grid and each execution takes 2 minutes
**D:** The team wants scale-to-zero behaviour to reduce overnight costs
**Answer:** B
**Explanation:** Custom CNI plugins require self-managed AKS with full cluster control and a dedicated Kubernetes engineering team to operate it. Option A describes managed AKS. Option C describes Azure Functions. Option D describes Container Apps. Self-managed AKS is only correct when managed options genuinely cannot meet requirements.
**Topic Tag:** self-managed-kubernetes

### Q11: Google Cloud Functions, AWS Lambda, and Azure Functions all share which of the following limitations?

**Type:** mcq
**A:** They cannot be triggered by HTTP requests
**B:** They require a container image to deploy
**C:** They are unsuitable for long-running processes due to execution timeout limits
**D:** They do not support automatic scaling
**Answer:** C
**Explanation:** All three FaaS platforms have execution timeout limits that make them unsuitable for long-running processes. Azure Functions defaults to 5–10 minutes, Lambda to 15 minutes, Cloud Functions to 9 minutes. All three scale automatically, support HTTP triggers, and deploy from code packages. The timeout limit is the defining constraint that determines whether FaaS is appropriate.
**Topic Tag:** faas

### Q12: An architect is choosing between AWS Fargate and AWS Lambda for a new workload. The workload is a containerized API that maintains an in-memory cache across requests and handles traffic continuously throughout the day. Which is correct and why?

**Type:** mcq
**A:** Lambda — because it supports containerized deployments
**B:** Fargate — because it supports long-running containers with persistent in-memory state across requests
**C:** Lambda — because continuous traffic is its primary use case
**D:** Fargate — but only when combined with ElastiCache to handle state
**Answer:** B
**Explanation:** Fargate runs long-running containers where in-memory state persists across requests on the same container instance. Lambda instances are stateless by design — in-memory cache cannot be relied upon across invocations. Lambda does support container images, but that does not change its execution model. The workload's continuous traffic and in-memory cache requirement both point to Fargate.
**Topic Tag:** managed-containers

---

## Summary

- IaaS (Azure VMs / EC2 / GCE) is the choice only when full OS control is required — it carries the highest operational responsibility of any tier
- PaaS web platforms (App Service / Elastic Beanstalk / App Engine) are for traditional web apps and APIs with no container or OS management needed
- Serverless containers (Container Apps / Fargate / Cloud Run) are the default recommendation for containerized workloads — no cluster to manage, scale to zero included
- Managed Kubernetes (AKS managed / EKS managed node groups / GKE Autopilot) is for teams that need Kubernetes tooling but not cluster operations overhead
- Self-managed Kubernetes (AKS / EKS self-managed / GKE Standard) is the last resort — only when managed options genuinely cannot meet requirements, and only with a dedicated ops team
- FaaS (Functions / Lambda / Cloud Functions) is for event-driven, short-lived workloads — execution timeout limits make it unsuitable for long-running or stateful services
- The preference hierarchy is the same across all three providers: serverless containers → managed Kubernetes → self-managed Kubernetes
- Lift-and-shift migrations that cannot be containerized go to IaaS; those that can be containerized go to the container tier; cloud-optimized refactors go to the PaaS web tier
- Scale-to-zero is available on the serverless container tier and FaaS tier — cost-effective for variable or unpredictable traffic
- The biggest operational risk in cloud compute is choosing too low a level of abstraction — always start at the highest managed tier that meets your requirements
