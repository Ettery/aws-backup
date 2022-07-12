import JSZip from "jszip";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { bucketName, fileName, folderName, folderZipName } from "./config.js";
import archiver from "archiver";
import { format } from "date-fns/fp";

const fileExt = 'txt';
const filePathToZip = `data/${fileName}.${fileExt}`;
let fileNameOfZip = `day/${fileName}.${new Date().getDate()}.zip`;

process(filePathToZip, fileNameOfZip, bucketName);

if(new Date().getDate() == 1){
    fileNameOfZip = `month/${fileName}.${format(new Date(), "yyyy-MM-dd")}.zip`;
    process(filePathToZip, fileNameOfZip, bucketName);
}

async function process(filePathToZip, fileNameOfZip, bucketName) {
    let zipBuffer = await zipFile(filePathToZip);
    await uploadZipToS3v2(zipBuffer, bucketName, fileNameOfZip);

    zipBuffer = await zipFolder(folderName, uploadToS3Callback);
}

async function uploadToS3Callback(zipBuffer){
    await uploadZipToS3v2(zipBuffer, bucketName, folderZipName);
}

async function zipFile(filePath) {
    let zip = new JSZip();
    const buffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    zip.file(fileName, buffer);

    const content = await zip.generateAsync({ type: "nodebuffer" });
    return content;
}

async function zipFolder(folderPath, callbackOnSuccess) {
    const zipName = "folder.zip";
    const output = fs.createWriteStream(zipName);

    output.on('close', function () {
        callbackOnSuccess(fs.readFileSync(zipName));
        fs.rm(zipName, () => {console.log("file removed")});
    });

    const archive = archiver("zip");
    archive.on('error', function(err){
        throw err;
    });

    archive.pipe(output);
    archive.directory(folderPath);
    await archive.finalize();
}

async function uploadZipToS3v2(zipBuffer, bucketName, objectName) {
    // Upload ZIP to S3
    const client = new S3Client({ region: "af-south-1" });
    const command = new PutObjectCommand({ Body: zipBuffer, Bucket: bucketName, Key: objectName, ServerSideEncryption: "AES256" });
    const response = await client.send(command);

    if (response)
        console.log(`${objectName} uploaded to bucket: ${bucketName}`);
    else
        console.log('failure');
}
