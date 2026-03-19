using System.Collections.Generic;
using Pulumi;
using Pulumi.Aws.S3;

return await Deployment.RunAsync(() =>
{
    // Create an AWS resource (S3 Bucket)
    var bucket = new Bucket("yahoo-bucket");

    // Export the name of the bucket
    return new Dictionary<string, object?> { ["bucketName"] = bucket.Id };
});
