using System.Collections.Generic;
using Pulumi;
using TeleHealth.Infra;

return await Deployment.RunAsync(() =>
{
    var cfg = new StackConfig();

    // Create resources in dependency order
    var net = Networking.Create(cfg);
    var storage = Storage.Create(cfg);
    var msg = Messaging.Create(cfg);
    var db = Database.Create(cfg, net);
    var obs = Observability.Create(cfg, db, msg);
    var compute = Compute.Create(cfg, net, storage, db, msg, obs);
    var serverless = Serverless.Create(cfg, msg, storage);

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
        ["XRayGroupArn"] = obs.XrayGroup.Arn,
        ["ApiLogGroupName"] = obs.ApiLogGroup.Name,
        // ["LambdaFunctionName"] = serverless.PdfProcessorLambda.Name,
        // ["ReminderLambdaName"] = serverless.ReminderLambda.Name,
    };
});
