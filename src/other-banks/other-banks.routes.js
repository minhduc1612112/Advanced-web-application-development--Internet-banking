const express = require("express");
const openpgp = require("openpgp");

const accountModel = require("../accounts/accounts.models");

const commonMethod = require("../common/common.methods");
const otherBankMethod = require("./other-banks.methods");

const key = require("../../variables/keys");
const transactionModle = require("../transactions/transactions.models");

const router = express.Router();

const checkValidityPartner = async (xHashedData) => {
  const decodedHashedData = await commonMethod.verifyToken(
    xHashedData,
    key.secretString
  );
  if (!decodedHashedData) {
    return null;
  }
  return decodedHashedData;
};

const checkValidityTime = (decodedHashedData) => {
  const iatNow = commonMethod.getIssuedAtNow();
  const {
    iat
  } = decodedHashedData.payload;
  // if (iatNow - iat > key.validityTime) {
  //     return false;
  // }
  return true;
};

const checkValidityData = async (encryptedData) => {
  const decryptedData = await otherBankMethod.decrypted(encryptedData);
  if (!decryptedData) {
    return null;
  }
  const data = JSON.parse(decryptedData);
  return data;
};

router.post("/query-account-information", async (req, res) => {
  // INPUT
  // const data = {
  //     desAccountNumber: '1111000000001',
  //     desBankCode: 'GROUP2Bank',
  //     iat: commonMethod.getIssuedAtNow()
  // }
  // headers: x_hashed_data
  // body: encrypted_data

  const xHashedData = req.headers.x_hashed_data;
  // const encryptedData = req.body.encrypted_data;
  const encryptedData = `-----BEGIN PGP MESSAGE-----
Version: OpenPGP.js v4.10.4
Comment: https://openpgpjs.org

wcBMA3+LEt36YyzmAQf5AD8epp4FC3tUTRHXEJO1ZCV9+MfpNwuargmGqbsh
X/h2Sih2hKAWbkStr1n3kX/LWfJ/awBcX292aPTMka/hgy9TUHz5thEq/bqx
Qq/xLD5zVJZBDft+U+T+KrPlyvNBdefMTAKQAwY7mUlu7OCFmPwj8wtefoNL
RgxHNIV4l2UHBXzOZZr+QjHsKuDx7EbbIJitXWqPcOCAO65wkGk7vjAfpsWy
5PM3RHHUT25hW9QUY99OYC/mp5cOwSIzLkUcP77hx2quxqSJDHKk2hW7HL0Y
2gIQ24ngNAmRgT6ZiAiYjG/BDeJzKNgjRhzGv+n0RwnJ5bGEFpCAOoXCp7B5
WdKFAXmTypItUK7UdxtaTLiZJJM2dpmuxX2TuBA0U/U3v8eMVyZlZ3m8k+s1
Tp+BlAstRGsM3HcCxLkp1Uvnfms6c4mUWxVe9+ZockTOsoVdm6XKR8kNg8Dv
oIGLe03l4Ke7Mq4/VvIqdF7ULIRYNav7ysnwiXoapvA4Dx0y998RLpaKfsbK
QQ==
=gVMh
-----END PGP MESSAGE-----`;

  const decodedHashedData = await checkValidityPartner(xHashedData);
  if (!decodedHashedData) {
    return res.status(401).send({
      status: -1,
      msg: "Ngân hàng của bạn chưa được liên kết với ngân hàng này.",
    });
  }

  const validityTime = checkValidityTime(decodedHashedData);
  if (!validityTime) {
    return res.status(400).send({
      status: -2,
      msg: "Lời gọi này là thông tin cũ đã quá hạn.",
    });
  }

  const data = await checkValidityData(encryptedData);
  if (!data) {
    return res.status(400).send({
      status: -3,
      msg: "Lỗi bảo mật: Thông tin gói tin gửi đi đã bị chỉnh sửa, vui lòng không thực hiện giao dịch để đảm bảo an toàn.",
    });
  }

  // Query data từ database
  const account = await accountModel.getAccountByAccountNumber(
    data.desAccountNumber
  );
  if (!account) {
    return res.status(400).send({
      status: -4,
      msg: "Tài khoản không tồn tại.",
    });
  }

  return res.send({
    desAccountNumber: account.accountNumber,
    desAccountName: account.accountName,
  });
});

router.post("/payment-on-account", async (req, res) => {
  // INPUT
  // const data = {
  //     srcAccountNumber:'987654321',
  //     srcBankCode,
  //     desAccountNumber: '1111000000001',
  //     desBankCode,
  //     money,
  //     content,
  //     iat: commonMethod.getIssuedAtNow()
  // }
  // headers: x_hashed_data
  // body: encrypted_data, signed_data

  const xHashedData = req.headers.x_hashed_data;

  const decodedHashedData = await checkValidityPartner(xHashedData);
  if (!decodedHashedData) {
    return res.status(401).send({
      status: -1,
      msg: "Ngân hàng của bạn chưa được liên kết với ngân hàng này.",
    });
  }

  const validityTime = checkValidityTime(decodedHashedData);
  if (!validityTime) {
    return res.status(400).send({
      status: -2,
      msg: "Lời gọi này là thông tin cũ đã quá hạn.",
    });
  }

  // const encryptedData = req.body.encrypted_data;
  const encryptedData = `-----BEGIN PGP MESSAGE-----
Version: OpenPGP.js v4.10.4
Comment: https://openpgpjs.org

wcBMA3+LEt36YyzmAQf/XgJdghViG7IBF5C15JPVj41anv7cMjFk/6Bm2WqF
BHbxNqyJQmU4WXcDRfZLaeWmDH1Ww+N1CBwdovLVsCnsCVwDyIjdwdBiPDWJ
I8F4GcF51ptaJTIi4jBx3AiLoJxojHh0P2hgLPn7BPKvZGYxTvjmjdJMYgzv
lCxIOGFDEQhiuhFXVx2QUblnjfD5mKWuniQvj0iZ+qHFFXS9n1zOmrWqmzje
kOVxKmRbP1+QYrAzlKfp8mNiQj5EfsLMST4gCGbcgE6GevbFta3ie0hL9bWw
s/3UYV9UGlK2llhfX8E8ssJ14MAYKWN1RHNTXALuYhdrhPwev7keMOfYH3jh
edLAKgFK9u/qzzjpyOP1fo/XhBD7A9EusNXMZrm4O/vRWpJbKwV4vu9hnCeU
UP37ZJ+ViqV98x+WpyowmeHf69aalDIPbZrrloXrME0GdsBdRNXStMlHTVEj
JUsk+5cPlJzFfz9lvejauqh+t0/CmYSP53LIF4lvGDv5j5hebAE9owFd5zpL
lvxpLzJO/WMS1E0t7+ll4LOZ1VYL2pa4xo6bmlIIE/orxdCK/V2jdWtJS92Y
vq7nsnphEl9GZC3fjwXh0eXX3zEe0NTDgc/8JJXo5MwgNqMdP8porXyFjdlt
GJ+RBDlQxcgXHyHdUg==
=KnpV
-----END PGP MESSAGE-----`;

  const data = await checkValidityData(encryptedData);
  if (!data) {
    return res.status(400).send({
      status: -3,
      msg: "Lỗi bảo mật: Thông tin gói tin gửi đi đã bị chỉnh sửa, vui lòng không thực hiện giao dịch để đảm bảo an toàn.",
    });
  }

  // const signedData = req.body.signed_data;
  const signedData = `-----BEGIN PGP SIGNED MESSAGE-----
Hash: SHA512

{"srcAccountNumber":"987654321","srcBankCode":"KL_BANK","desAccountNumber":"1111000000001","desBankCode":"GROUP2Bank","money":10000000,"content":"Trả lương","iat":1593271537}
-----BEGIN PGP SIGNATURE-----
Version: OpenPGP.js v4.10.4
Comment: https://openpgpjs.org

wsBcBAEBCgAGBQJe92TxAAoJEIxnrBZcmHDWR58H/AwOQusvc0v7iivNU68o
OSlxfsi2AVEN4Yb/OuOtVsYtvnYDlU1d7qSnI7BMDQhpnUDaY9UeGHnPtXSd
TuDkfwg+aSH9nmmTkRmxDKGfA0RbIAD64XR94cm0uCk1L4k4JQvoHnael1tx
rJ36ITpENXliO4cyA6d4luKVibBnjBmv0mb/bOiwr2CsP9VACmzpCJkzZzTi
R6rynozr/3Q7K/Xe1FOu6V8ot+BgjWHzFzv1AmyaIhf2vUwTy5FxX2TTrMo5
cN+pgW8PXH+mBjXNtw2lsJYWBF9CEe96Ug06Nq+8a/gKtIpq7kwy1+xXXPU/
z+BUNjcm0zQ+rQNskTGsxNA=
=Nqy6
-----END PGP SIGNATURE-----`;
  const verifiedData = await otherBankMethod.verified(signedData);
  if (!verifiedData) {
    return res.status(400).send({
      status: -4,
      msg: "Chữ kí không hợp lệ.",
    });
  }

  // Query tài khoản từ database
  const account = await accountModel.getAccountByAccountNumber(
    data.desAccountNumber
  );
  const desLatestTransaction = await transactionModle.latestTransaction(
    data.desAccountNumber
  );
  if (!account || !desLatestTransaction) {
    return res.status(400).send({
      status: -5,
      msg: "Tài khoản không tồn tại.",
    });
  }

  // Thực hiện nạp tiền vào tài khoản đó
  const transaction = {
    ...data,
    accountNumber: desLatestTransaction.accountNumber,
    accountMoney: desLatestTransaction.accountMoney + data.money,
    createdAt: commonMethod.getIssuedAtNow(),
    datetime: commonMethod.getDatetimeNow(),
    typeNumber: 6,
    type: 'Nhận tiền từ tài khoản ngân hàng khác',
  };
  const addTransaction = await transactionModle.addTransaction(transaction);
  if (!addTransaction) {
    return res.status(400).send({
      status: -6,
      msg: "Giao dịch không thành công, vui lòng thử lại.",
    });
  }

  const result = {
    ...data,
    status: 200,
    msg: `Giao dịch thành công.`,
  };
  const dataForSign = JSON.stringify(result);
  // Tạo chữ kí gửi lại cho B
  const resSignedData = await otherBankMethod.signed(dataForSign);
  if (!resSignedData) {
    return res.status(400).send({
      status: -7,
      msg: "Tạo chữ kí không thành công.",
    });
  }

  return res.send({
    signedData: resSignedData,
    msg: "Giao dịch thành công",
  });
});

// Hàm để tạo các data tạm thời
const generateKey = async () => {
  // const data = {
  //     desAccountNumber: '1111000000001',
  //     desBankCode: 'GROUP2Bank',
  //     iat: commonMethod.getIssuedAtNow()
  // }
  const data = {
    srcAccountNumber: "987654321",
    srcBankCode: "KL_BANK",
    desAccountNumber: "1111000000001",
    desBankCode: "GROUP2Bank",
    money: 10000000,
    content: "Trả lương",
    iat: commonMethod.getIssuedAtNow(),
  };
  const dataString = JSON.stringify(data);

  // const xHashedData = await commonMethod.generateToken(data, key.secretString, '1y');
  // console.log('Hashed data: ' + xHashedData);

  // const encryptedData = await otherBankMethod.encrypted(dataString);
  // console.log('Encrypted data: ' + encryptedData);

  // const signedData = await otherBankMethod.signed(dataString);
  // console.log('Signed data: ' + signedData);

  //     const verifiedData = await otherBankMethod.verified(`-----BEGIN PGP SIGNED MESSAGE-----
  // Hash: SHA512

  // {"accountNumber":"123456789","iat":1590514817}
  // -----BEGIN PGP SIGNATURE-----
  // Version: OpenPGP.js v4.10.4
  // Comment: https://openpgpjs.org

  // wsBcBAEBCgAGBQJezVSCAAoJEIxnrBZcmHDW9IAH/iywfeefF7deRsfBxSLl
  // OwsF4UuReJZZ4Qs82rb/2tfk7TRQjR0RmGYOG2XWbeRTzZeqS3DPMd6wI9Zs
  // tr7dB2OC7BI0UAVOVfNPgujMjbjrLqmFR3oaSGWLI4zL0wAth7I8nx42R2EG
  // at4LNcPT2++jT9O1bQPftsR3WNioIBd2fYWzTDoOeRGJD8FqWSSl6haKjuv6
  // D1V7WIBjwgkZP/8nWawPRSwJT0/pulZFdhflYA27PoiSOkpSse/x7PkKW/rr
  // ETwlazBLJPoDEFOtUMMnQa/aGI53avR2z2FYTkinx1KJpeGWgnkJ3H9FBOol
  // 56w+vUUa7Qp01gpxQJsfy5E=
  // =mEJQ
  // -----END PGP SIGNATURE-----`);
  //     console.log(verifiedData);
};
generateKey();

module.exports = router;