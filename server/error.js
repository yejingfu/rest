var errCode = {
  OK: 0,
  DBCONN: 1,
  DBQUERY: 2,
  DBUPDATE:3,
  DBUSERNOTEXIST: 12,
  DBUSERPROFILENOTEXIST: 13,
  DBUSERDUP: 14,
  DBFAILEDADDUSER: 15,
  DBFAILEDADDPROFILE: 16,
  DBFAILEDGETUSER: 17,
  DBFAILEDUPDATEUSER: 18,
  DBFAILEDUPDATEPROFILE:19,
  DBFAILEDGETPROFILE:20,
  DBFAILEDADDBOOK:21,
  DBBOOKNOTEXIST:22,
  DBBOOKDUP:23,
  DBFAILEDADDBAR: 24,
  DBBARNOTEXIST: 25,
  DBBARDUP: 26,
  APIUSERIDISEMPTY:40,
  APIPHONEISEMPTY: 41,
  APIPWDISEMPTY: 42,
  APIPHONEORPWDISEMPTY: 43,
  APIBOOKNOTFOUND:50,
  APIBOOKFAILED:51,
  APIBARFAILED:52,
  APIIMAGENOTEXIST:53,
  APIDOUBANGETBOOKFAILED:54,
  APIPARAMSMISSING:55,
  NOTIMPLEMENT:60,
  FAILEDDOWNLOADIMAGE:61,
  UNKNOWN:100
};

exports.errCode = errCode;
