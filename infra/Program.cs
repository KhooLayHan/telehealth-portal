using System.Collections.Generic;
using Pulumi;
using TeleHealth.Infra;

return await Deployment.RunAsync(() =>
{
    var cfg = new StackConfig();

    // Create resources in dependency order
    var net = Networking.Create(cfg);
    var db = Database.Create(cfg, net);
    var storage = Storage.Create(cfg);
    var msg = Messaging.Create(cfg);
    var obs = Observability.Create(cfg, db, msg); // RDS alarms active
    var serverless = Serverless.Create(cfg, msg, storage, net, db); // VPC/DB features active
    var compute = Compute.Create(cfg, net, storage, db, msg, obs, serverless);

    // Stack outputs — used by GitHub Actions CD workflow
    return new Dictionary<string, object?>
    {
        ["FrontendUrl"] = storage.FrontendWebsiteConfig.WebsiteEndpoint,
        ["ApiUrl"] = compute.EbEnv.EndpointUrl,
        ["DatabaseEndpoint"] = db.Instance.Endpoint,
        ["DatabaseAddress"] = db.Instance.Address,
        ["S3LabReportsBucket"] = storage.LabReportsBucket.BucketName,
        ["S3ArtifactsBucket"] = storage.ArtifactsBucket.BucketName,
        ["SnsTopicArn"] = msg.MedicalAlertsTopic.Arn,
        ["SqsQueueUrl"] = msg.ProcessingQueue.Id,
        ["DlqUrl"] = msg.DeadLetterQueue.Id,
        ["FrontendBucketName"] = storage.FrontendBucket.BucketName,
        ["EbAppName"] = compute.EbApp.Name,
        ["EbEnvName"] = compute.EbEnv.Name,
        ["EcrRepositoryUrl"] = compute.EcrRepo.RepositoryUrl,
        ["DbSecretArn"] = db.DbSecret.Arn,
        ["DbInstanceIdentifier"] = db.Instance.Identifier,
        ["XRayGroupArn"] = obs.XrayGroup.Arn,
        ["ApiLogGroupName"] = obs.ApiLogGroup.Name,
        ["LambdaFunctionName"] = serverless.PdfProcessorLambda.Name,
        ["ReminderLambdaName"] = serverless.ReminderLambda.Name,
        ["NotificationsLambdaName"] = serverless.NotificationsLambda.Name,
        ["AdminAnalyticsLambdaName"] = serverless.AdminAnalyticsLambda?.Name,
    };
});
