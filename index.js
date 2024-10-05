// #region firebase setup
// config
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
//#endregion

/*auth.onAuthStateChanged((user) => {
    if (user) {
      var uid = user.uid;
      console.log('User is signed in' + " " + uid);
    } else {
      // User is signed out
      // ...
    }
  });*/

//document.getElementById('adminDiv').style.display = 'none';

//signin as admin
function signIn(password, email = "admin@hmtbc.com")
{
    console.log('Signing in with email: ' + email + " password: " + password);
    document.getElementById('status').innerHTML = 'signing in...';
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

async function getDataFromFile(){
    var f = "./data.json";
    var result = null;

    await fetch(f)
    .then((res) => res.json())
    .then((data) => {result = JSON.stringify(data);})
    .catch((e) => console.error(e));
    
    return result;
}

async function getBookRecords(){
    var ver = await db.collection('version').doc('version').get()
    .then((doc) => doc.data().version);
    console.log(ver);
    if (localStorage.getItem('version') != ver)
    {
        data = await db.collection('books').doc(ver).get().then((rec) => rec.data().json);
        localStorage.setItem('data', JSON.stringify(data));
        localStorage.setItem('version', ver);
    }
    else 
    {
        data = JSON.parse(JSON.parse(localStorage.getItem('data')));
    }
    console.log(data.length);
}

//add book record to database
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

//add book record to database
function createBookRecord(rID, cNum1, cNum2, title, author, publisher, notes){
    return({
        rID: rID == null ? '' : rID,
        cNum1: cNum1 == null ? '' : cNum1,
        cNum2: cNum2 == null ? '' : cNum2,
        title: title == null ? '' : title,
        author: author == null ? '' : author,
        publisher: publisher == null ? '' : publisher,
        notes: notes == null ? '' : notes
    })
}

//refresh book record display
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

async function query(q, type)
{
    var div = document.getElementById('resultList');
    div.innerHTML = '搜尋中';
    var resultHTML = '';

    var dataScore = structuredClone(data);
    console.log(typeof(data));
    dataScore.forEach((doc) => {
        doc.score = 0;
        switch(type){
            case 'rID':
                if (doc.rID == q) {doc.score += 1;}
                break;
            case 'cNum1':
                if (doc.cNum1 == q) {doc.score += 1;}
                break;
            case 'cNum2':
                if (doc.cNum2 == q) {doc.score += 1;}
                break;
            case 'title':
                if (doc.title.includes(q)) {doc.score += 1;}
                break;
            case 'author':
                if (doc.author.includes(q)) {doc.score += 1;}
                break;
            case 'publisher':
                if (doc.publisher.includes(q)) {doc.score += 1;}
                break;
        }
    });
    var entries = dataScore.filter((doc) => doc.score > 0);
    entries.sort((a, b) => b.score - a.score);

    
    entries.forEach((doc) => {
        resultHTML += `
        <div>
            <h2>${doc.title}</h2>
            <h4>${doc.author}</h4>
            <table>
                <tbody>
                    <tr>
                        <td>出版</td>
                        <td>${doc.publisher}</td>
                    </tr>
                    <tr>
                        <td>RID</td>
                        <td>${doc.rID}</td>
                    </tr>
                    <tr>
                        <td>cNum1</td>
                        <td>${doc.cNum1}</td>
                    </tr>
                    <tr>
                        <td>cNum2</td>
                        <td>${doc.cNum2}</td>
                    </tr>
                </tbody>
            </table>
            <hr>
        <div>
        `;
    });
    div.innerHTML = resultHTML;

    document.getElementById('res').innerHTML = '搜尋結果: ' + entries.length + '筆';
}

//read book records from database
/*db.collection("books").get().then((querySnapshot) => {
    data = querySnapshot;
    querySnapshot.forEach((doc) => {
        //console.log(`${doc.id} => ${doc.data().title}`);
        data[0] = structuredClone(doc.data());
    });
    
});*/
//console.log(data.length);
//console.log(data);


var bookRecords = [];
var data = [];

//sign in listener
document.getElementById('pw').addEventListener('keyup', function(e) {
    e.preventDefault();
    if (e.key === 'Enter' || e.keyCode === 13) {
        document.getElementById("signin").click();
    }
});
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

 //upload book records to database listener
document.getElementById('writeData').addEventListener('click', function(e) {
    console.log('writeData clicked' + " " + bookRecords.length);
    var skipped = parseInt(document.getElementById('skipLine').value);
    skipped = isNaN(skipped) ? 0 : skipped;
    for (var i = skipped; i < bookRecords.length; i++){
        if (bookRecords[i].length < 6){
            continue;
        }
        //writeBookRecord(bookRecords[i][0], bookRecords[i][1], bookRecords[i][2], bookRecords[i][3], bookRecords[i][4], bookRecords[i][5], '');
        data.push(createBookRecord(bookRecords[i][0], bookRecords[i][1], bookRecords[i][2], bookRecords[i][3], bookRecords[i][4], bookRecords[i][5], ''));
    }
    localStorage.setItem('data', JSON.stringify(data));
 });

await getBookRecords();

const params = new URLSearchParams(document.location.search);
document.getElementById('searchInput').value = params.get('searchInput');
document.getElementById('searchType').value = params.get('searchType');
query(params.get('searchInput'), params.get('searchType'));
//localStorage.setItem('data', JSON.stringify(data));
//var loaded = localStorage.getItem('data') != null ? JSON.parse(localStorage.getItem('data')) : getDataFromFile();
//var loaded = await getDataFromFile();
//console.log(loaded);
