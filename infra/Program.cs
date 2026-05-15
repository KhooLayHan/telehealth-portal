using System.Collections.Generic;
using Pulumi;
using TeleHealth.Infra;

return await Deployment.RunAsync(() =>
{
    var cfg = new StackConfig();

    // Create resources in dependency order
    var storage = Storage.Create(cfg);
    var msg = Messaging.Create(cfg);
    var obs = Observability.Create(cfg);
    var serverless = Serverless.Create(cfg, msg, storage);

    // Stack outputs — used by GitHub Actions CD workflow
    return new Dictionary<string, object?>
    {
        ["FrontendUrl"] = storage.FrontendWebsiteConfig.WebsiteEndpoint,
        ["S3LabReportsBucket"] = storage.LabReportsBucket.BucketName,
        ["S3ArtifactsBucket"] = storage.ArtifactsBucket.BucketName,
        ["SnsTopicArn"] = msg.MedicalAlertsTopic.Arn,
        ["SqsQueueUrl"] = msg.ProcessingQueue.Id,
        ["DlqUrl"] = msg.DeadLetterQueue.Id,
        ["FrontendBucketName"] = storage.FrontendBucket.BucketName,
        ["XRayGroupArn"] = obs.XrayGroup.Arn,
        ["ApiLogGroupName"] = obs.ApiLogGroup.Name,
        ["LambdaFunctionName"] = serverless.PdfProcessorLambda.Name,
        ["ReminderLambdaName"] = serverless.ReminderLambda.Name,
        ["NotificationsLambdaName"] = serverless.NotificationsLambda.Name,
        ["AdminAnalyticsLambdaName"] = serverless.AdminAnalyticsLambda.Name,
        ["AdminAnalyticsApiEndpoint"] = serverless.AdminAnalyticsApi.ApiEndpoint,
    };
});
