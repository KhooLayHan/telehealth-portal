namespace TeleHealth.Infra;

using System.Collections.Immutable;
using Pulumi;
using Aws = Pulumi.Aws;

/// <summary>
/// VPC lookups and security groups for the TeleHealth stack.
/// Uses the default VPC but locks down DB access to EB instances only.
/// </summary>
public static class Networking
{
    public sealed class Result
    {
        public required Output<string> VpcId { get; init; }
        public required Output<ImmutableArray<string>> SubnetIds { get; init; }
        public required Aws.Ec2.SecurityGroup EbSecurityGroup { get; init; }
        public required Aws.Ec2.SecurityGroup DbSecurityGroup { get; init; }
        public required Aws.Rds.SubnetGroup DbSubnetGroup { get; init; }
    }

    public static Result Create(StackConfig cfg)
    {
        var defaultVpc = Aws.Ec2.GetVpc.Invoke(new Aws.Ec2.GetVpcInvokeArgs { Default = true });

        var defaultSubnets = Aws.Ec2.GetSubnets.Invoke(
            new Aws.Ec2.GetSubnetsInvokeArgs
            {
                Filters = new[]
                {
                    new Aws.Ec2.Inputs.GetSubnetsFilterInputArgs
                    {
                        Name = "vpc-id",
                        Values = new[] { defaultVpc.Apply(v => v.Id) },
                    },
                },
            }
        );

        // Elastic Beanstalk instances — HTTP/HTTPS from the internet
        var ebSecurityGroup = new Aws.Ec2.SecurityGroup(
            "eb-sg",
            new Aws.Ec2.SecurityGroupArgs
            {
                Description = "TeleHealth API — Elastic Beanstalk instances",
                VpcId = defaultVpc.Apply(v => v.Id),
                Ingress = new[]
                {
                    new Aws.Ec2.Inputs.SecurityGroupIngressArgs
                    {
                        Protocol = "tcp",
                        FromPort = 80,
                        ToPort = 80,
                        CidrBlocks = { "0.0.0.0/0" },
                        Description = "HTTP from load balancer / internet",
                    },
                    new Aws.Ec2.Inputs.SecurityGroupIngressArgs
                    {
                        Protocol = "tcp",
                        FromPort = 443,
                        ToPort = 443,
                        CidrBlocks = { "0.0.0.0/0" },
                        Description = "HTTPS from load balancer / internet",
                    },
                },
                Egress = new[]
                {
                    new Aws.Ec2.Inputs.SecurityGroupEgressArgs
                    {
                        Protocol = "-1",
                        FromPort = 0,
                        ToPort = 0,
                        CidrBlocks = { "0.0.0.0/0" },
                        Description = "Allow all outbound",
                    },
                },
                Tags = cfg.Tags,
            }
        );

        // RDS — port 5432 only from the EB security group, NOT the internet
        var dbSecurityGroup = new Aws.Ec2.SecurityGroup(
            "db-sg",
            new Aws.Ec2.SecurityGroupArgs
            {
                Description = "TeleHealth RDS — PostgreSQL accessible from EB only",
                VpcId = defaultVpc.Apply(v => v.Id),
                Ingress = new[]
                {
                    new Aws.Ec2.Inputs.SecurityGroupIngressArgs
                    {
                        Protocol = "tcp",
                        FromPort = 5432,
                        ToPort = 5432,
                        SecurityGroups = { ebSecurityGroup.Id },
                        Description = "PostgreSQL from Elastic Beanstalk instances only",
                    },
                },
                Egress = new[]
                {
                    new Aws.Ec2.Inputs.SecurityGroupEgressArgs
                    {
                        Protocol = "-1",
                        FromPort = 0,
                        ToPort = 0,
                        CidrBlocks = { "0.0.0.0/0" },
                    },
                },
                Tags = cfg.Tags,
            }
        );

        var dbSubnetGroup = new Aws.Rds.SubnetGroup(
            "telehealth-db-subnet-group",
            new Aws.Rds.SubnetGroupArgs
            {
                SubnetIds = defaultSubnets.Apply(s => s.Ids),
                Tags = cfg.Tags,
            }
        );

        return new Result
        {
            VpcId = defaultVpc.Apply(v => v.Id),
            SubnetIds = defaultSubnets.Apply(s => s.Ids),
            EbSecurityGroup = ebSecurityGroup,
            DbSecurityGroup = dbSecurityGroup,
            DbSubnetGroup = dbSubnetGroup,
        };
    }
}
