using System.Collections.Generic;
using Pulumi;
using TeleHealth.Infra;

return await Deployment.RunAsync(() =>
{
    var cfg = new StackConfig();

    // Create resources in dependency order
    //
    // ── DISABLED: RDS + Elastic Beanstalk (cost saving — uncomment to restore) ────
    // var net = Networking.Create(cfg);
    // var db  = Database.Create(cfg, net);
    // ────────────────────────────────────────────────────────────────────────────────
    var storage = Storage.Create(cfg);
    var msg = Messaging.Create(cfg);
    var obs = Observability.Create(cfg);                        // RDS alarms skipped while DB is off
    var serverless = Serverless.Create(cfg, msg, storage);      // VPC/DB features skipped while DB is off
    // var compute = Compute.Create(cfg, net, storage, db, msg, obs, serverless);

    // Stack outputs — used by GitHub Actions CD workflow
    return new Dictionary<string, object?>
    {
        ["FrontendUrl"] = storage.FrontendWebsiteConfig.WebsiteEndpoint,
        // ["ApiUrl"]           = compute.EbEnv.EndpointUrl,      // disabled
        // ["DatabaseEndpoint"] = db.Instance.Endpoint,           // disabled
        // ["DatabaseAddress"]  = db.Instance.Address,            // disabled
        ["S3LabReportsBucket"] = storage.LabReportsBucket.BucketName,
        ["S3ArtifactsBucket"] = storage.ArtifactsBucket.BucketName,
        ["SnsTopicArn"] = msg.MedicalAlertsTopic.Arn,
        ["SqsQueueUrl"] = msg.ProcessingQueue.Id,
        ["DlqUrl"] = msg.DeadLetterQueue.Id,
        ["FrontendBucketName"] = storage.FrontendBucket.BucketName,
        // ["EbAppName"]        = compute.EbApp.Name,             // disabled
        // ["EbEnvName"]        = compute.EbEnv.Name,             // disabled
        // ["EcrRepositoryUrl"] = compute.EcrRepo.RepositoryUrl,  // disabled
        // ["DbSecretArn"]      = db.DbSecret.Arn,                // disabled
        ["XRayGroupArn"] = obs.XrayGroup.Arn,
        ["ApiLogGroupName"] = obs.ApiLogGroup.Name,
        ["LambdaFunctionName"] = serverless.PdfProcessorLambda.Name,
        ["ReminderLambdaName"] = serverless.ReminderLambda.Name,
        ["NotificationsLambdaName"] = serverless.NotificationsLambda.Name,
        // ["AdminAnalyticsLambdaName"] = serverless.AdminAnalyticsLambda?.Name, // disabled (needs DB)
    };
});
