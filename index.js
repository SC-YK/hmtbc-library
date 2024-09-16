const firebaseConfig = {
    apiKey: "AIzaSyBeZky7HHfkoWj_i4wbVJUF5z67b93HLv4",
    authDomain: "hmtbc-library-db.firebaseapp.com",
    databaseURL: "https://hmtbc-library-db-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "hmtbc-library-db",
    storageBucket: "hmtbc-library-db.appspot.com",
    messagingSenderId: "116116691688",
    appId: "1:116116691688:web:0af255ad537a8e7e1b875d"
};

// Initialize
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

auth.setPersistence(firebase.auth.Auth.Persistence.NONE)
  .then(() => {
    // Existing and future Auth states are now persisted in the current
    // session only. Closing the window would clear any existing state even
    // if a user forgets to sign out.
    // ...
    // New sign-in will be persisted with session persistence.
    console.log('Persistence set');
    //return firebase.auth().signInWithEmailAndPassword(email, password);
  })
  .catch((error) => {
    // Handle Errors here.
    var errorCode = error.code;
    var errorMessage = error.message;
  });

/*auth.onAuthStateChanged((user) => {
    if (user) {
      var uid = user.uid;
      console.log('User is signed in' + " " + uid);
    } else {
      // User is signed out
      // ...
    }
  });*/

document.getElementById('adminDiv').style.display = 'none';

function signIn(password, email = "admin@hmtbc.com")
{
    console.log('Signing in with email: ' + email + " password: " + password);
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            var user = userCredential.user;
            console.log('User signed in: ' + user.uid);
            document.getElementById('pwDiv').innerHTML = 'sign in success';
            document.getElementById('adminDiv').style.display = '';
            // ...
        })
        .catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log('Error: ' + errorCode + " " + errorMessage);
            document.getElementById('status').innerHTML = 'sign in failed, maybe password incorrect';
        });
}

function writeBookRecord(rID, cNum1, cNum2, title, author, publisher, notes){
    db.collection("books").add({
        rID: rID == null ? '' : rID,
        cNum1: cNum1 == null ? '' : cNum1,
        cNum2: cNum2 == null ? '' : cNum2,
        title: title == null ? '' : title,
        author: author == null ? '' : author,
        publisher: publisher == null ? '' : publisher,
        notes: notes == null ? '' : notes
    })
    .then((docRef) => {
        console.log("Document written with ID: ", docRef.id);
    })
    .catch((error) => {
        console.error("Error adding document: ", error);
    });  
}

function updateBookRecordDisplay(){
    bookRecords = [];
    document.getElementById('result').innerHTML = '';
    var file = document.getElementById('inputFile').files[0];
    // input canceled, return
    if (!file)
    {
        return;
    }
    var FR = new FileReader();
    FR.onload = function(e) {
        var data = new Uint8Array(e.target.result);
        var workbook = XLSX.read(data, {type: 'array'});
        var firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        bookRecords = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        var output = document.getElementById('result');

        const table = document.createElement("table");
        var skipped = parseInt(document.getElementById('skipLine').value);
        skipped = isNaN(skipped) ? 0 : skipped;
        for (var i = skipped; i < bookRecords.length; i++){
            const tr = document.createElement("tr");
            table.appendChild(tr);
            for (var j = 0; j < bookRecords[i].length; j++){
                const td = document.createElement("td");
                tr.appendChild(td);
                td.innerHTML = bookRecords[i][j] == null ? '' : bookRecords[i][j];
          }
      }
      output.appendChild(table);
    };
    FR.readAsArrayBuffer(file);
}

db.collection("users").get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
        console.log(`${doc.id} => ${doc.data()}`);
    });
});

var bookRecords = [];

document.getElementById('signin').addEventListener('click', function(e) {
    console.log('signin clicked');
    signIn(document.getElementById('pw').value);
});

document.getElementById('inputFile').addEventListener('change', function(e) {
    updateBookRecordDisplay();
 });

document.getElementById('skipLine').addEventListener('input', function(e) {
    updateBookRecordDisplay();
 });

 document.getElementById('writeData').addEventListener('click', function(e) {
    console.log('writeData clicked' + " " + bookRecords.length);
    var skipped = parseInt(document.getElementById('skipLine').value);
    skipped = isNaN(skipped) ? 0 : skipped;
    for (var i = skipped; i < bookRecords.length; i++){
        if (bookRecords[i].length < 6){
            continue;
        }
        writeBookRecord(bookRecords[i][0], bookRecords[i][1], bookRecords[i][2], bookRecords[i][3], bookRecords[i][4], bookRecords[i][5], '');
    }
 });

