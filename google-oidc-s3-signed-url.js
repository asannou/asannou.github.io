var GOOGLE_API_KEY = "AIzaSyDX8qyzVvZRvoX1Z-x9xW2jUnK-JZ0tmt4";
var GOOGLE_CLIENT_ID = "622829682947-006feir2itcmiu1fvmjdmrkimj7t6f60.apps.googleusercontent.com";
var AWS_REGION = "ap-northeast-1";
var AWS_WEB_IDENTITY_ROLE_ARN = "arn:aws:iam::255384176336:role/google-oidc";

window.onload = function() {
  gapi.load("client:auth2", function() {
    gapi.client.init({
      apiKey: GOOGLE_API_KEY,
      clientId: GOOGLE_CLIENT_ID,
      scope: "profile"
    }).then(function () {
      var auth = gapi.auth2.getAuthInstance();
      auth.isSignedIn.listen(updateSigninStatus);
      updateSigninStatus(auth.isSignedIn.get());
    });
  });
  document.getElementById("signin").onclick = handleSignIn;
  document.getElementById("signout").onclick = handleSignOut;
};

function handleSignIn() {
  gapi.auth2.getAuthInstance().signIn();
}

function handleSignOut() {
  gapi.auth2.getAuthInstance().signOut();
  var anchor = document.getElementById("signedurl");
  anchor.setAttribute("href", "#");
  anchor.removeChild(anchor.firstChild);
}

function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    setCredentials();
    displaySignedUrl();
  }
}

function setCredentials() {
  var auth = gapi.auth2.getAuthInstance();
  var user = auth.currentUser.get();
  var token = user.getAuthResponse().id_token;
  AWS.config.region = AWS_REGION;
  AWS.config.credentials = new AWS.WebIdentityCredentials({
    RoleArn: AWS_WEB_IDENTITY_ROLE_ARN,
    WebIdentityToken: token
  });
}

function displaySignedUrl() {
  var url = decodeURIComponent(location.search.substring(1));
  var parsed = parseUrl(url);
  getSignedUrl(parsed.bucket, parsed.key, function(signedUrl) {
    var anchor = document.getElementById("signedurl");
    anchor.setAttribute("href", signedUrl);
    anchor.appendChild(document.createTextNode(url));
  });
}

function parseUrl(url) {
  var parser = document.createElement("a");
  parser.href = url;
  var path = parser.pathname.split("/").slice(1);
  return {
    bucket: path.shift(),
    key: path.join("/")
  };
}

function getSignedUrl(bucket, key, callback) {
  var s3 = new AWS.S3();
  s3.getSignedUrl("getObject", {
    Bucket: bucket,
    Key: key,
    Expires: 60
  }, function(err, url) {
    if (err) {
      console.log(err);
    } else {
      callback(url);
    }
  });
}

