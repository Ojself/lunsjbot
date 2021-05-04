const axiosConfig = {
  method: "get",
  url: process.env.EXTERNAL_API,
  headers: {
    Host: "apiv2.getofficeapp.com",
    "content-type": "application/json",
    accept: "application/json",
    "x-officeapp-environment": "com.officeapp.officeapp",
    "x-officeapp-language": "nb",
    "x-officeapp-token": process.env.X_OFFICEAPP_TOKEN,
    "accept-language": "nb-no",
    "x-officeapp-office": "147", // Sundtkvartalet
    "user-agent": "OfficeApp/3.11.0 (iPhone; iOS 14.4.2; Scale/2.00)",
    "x-officeapp-device": process.env.X_OFFICEAPP_DEVICE,
  },
};

module.exports = axiosConfig;
