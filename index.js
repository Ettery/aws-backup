import JSZip from "jszip";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { bucketName, fileName } from "./config";

const fileExt = 'txt';
const filePathToZip = `data/${fileName}.${fileExt}`;
const fileNameOfZip = `${fileName}.${new Date().getDate()}.zip`;

let zip = zipFile(filePathToZip);
uploadZipToS3(zip, bucketName, fileNameOfZip)

function zipFile(filePath){
    let zip = new JSZip();
    const buffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    zip.file(fileName, buffer);
    return zip;
}


function uploadZipToS3(zip, bucketName, objectName) {

    zip.generateAsync({ type: "nodebuffer" }).then(async (content) => {
        //fs.writeFileSync(objectName, content);

        // Upload ZIP to S3
        const client = new S3Client({ region: "af-south-1" });
        const command = new PutObjectCommand({ Body: content, Bucket: bucketName, Key: objectName, ServerSideEncryption: "AES256" });
        const response = await client.send(command);

        if (response)
            console.log('success');
        else
            console.log('failure');

    }, (reason) => {
        console.log(reason);
    });

}