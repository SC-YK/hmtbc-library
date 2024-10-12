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
    if (localStorage.getItem('version') != ver)
    {
        data = await db.collection('books').doc('records').get().then((rec) => rec.data());
        localStorage.setItem('data', JSON.stringify(data));
        localStorage.setItem('version', ver);
    }
    else 
    {
        data = JSON.parse(localStorage.getItem('data'));
    }
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
function createBookRecord(source, seq = [0,1,2,3,4,5,6]){
    const size = source.length;
    const selections = Array.from(document.getElementById('displayTable').querySelector('thead').querySelectorAll('select'));
    seq[0] = selections.findIndex((select) => select.value == 'rID');
    seq[1] = selections.findIndex((select) => select.value == 'cNum1');
    seq[2] = selections.findIndex((select) => select.value == 'cNum2');
    seq[3] = selections.findIndex((select) => select.value == 'title');
    seq[4] = selections.findIndex((select) => select.value == 'author');
    seq[5] = selections.findIndex((select) => select.value == 'publisher');
    seq[6] = selections.findIndex((select) => select.value == 'notes');
    return({
        key: (seq[0]>=size || source[seq[0]]==null) ? '' : source[seq[0]],
        data: {
            rID: (seq[0]==-1 || seq[0]>=size || source[seq[0]]==null) ? '' : source[seq[0]],
            cNum1: (seq[1]==-1 || seq[1]>=size || source[seq[1]]==null) ? '' : source[seq[1]],
            cNum2: (seq[2]==-1 || seq[2]>=size || source[seq[2]]==null) ? '' : source[seq[2]],
            title: (seq[3]==-1 || seq[3]>=size || source[seq[3]]==null) ? '' : source[seq[3]],
            author: (seq[4]==-1 || seq[4]>=size || source[seq[4]]==null) ? '' : source[seq[4]],
            publisher: (seq[5]==-1 || seq[5]>=size || source[seq[5]]==null) ? '' : source[seq[5]],
            notes: (seq[6]==-1 || seq[6]>=size || source[seq[6]]==null) ? '' : source[seq[6]]
        }
    })
}

//refresh book record display
function updateBookRecordDisplay(){
    bookRecords = [];
    bookRecordsSelected = [];
    document.getElementById('displayTable').querySelector('tbody').innerHTML = '';
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
        
        var skipped = parseInt(document.getElementById('skipLine').value);
        skipped = isNaN(skipped) ? 0 : skipped;

        bookRecords = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        bookRecords = bookRecords.filter((record) => record.length > 0);
        bookRecords.splice(0, skipped);
        
        var output = document.getElementById('result');

        const table = document.getElementById('displayTableBody');
        
        for (var i = 0; i < bookRecords.length; i++){
            const tr = document.createElement("tr");
            table.appendChild(tr);
            const selection = document.createElement("td");
            tr.appendChild(selection);
            selection.innerHTML = `
            <input type="checkbox" id="select${i}" checked="checked">
            `;
            bookRecordsSelected.push(true);

            (function(index) {
                selection.querySelector('input').addEventListener('change', function(){
                    bookRecordsSelected[index] = this.checked;
                    //console.log(index);
                    const rows = table.querySelectorAll('.order');
                    for (var j = 0, o = 0; j < rows.length; j++){
                        rows[j].innerHTML = bookRecordsSelected[j] ? "no." + (++o).toString() : '/';
                    }
                    document.getElementById("writeData").innerHTML = "上載 " + bookRecordsSelected.filter(x => x).length + " 項記錄";
                    //console.log(bookRecordsSelected.filter(x => x == true).length);
                });
            })(i);

            
            const td = document.createElement("td");
            tr.appendChild(td);
            td.className = "order";
            td.innerHTML = "no." + (i+1).toString();
            for (var j = 0; j < 7; j++){
                const td = document.createElement("td");
                tr.appendChild(td);
                td.innerHTML = (bookRecords[i].length < j || bookRecords[i][j] == null) ? '/' : bookRecords[i][j];
          }
      }
      document.getElementById("writeData").innerHTML = "上載 " + bookRecords.length + " 項記錄";
    };
    FR.readAsArrayBuffer(file);
}

document.getElementById('selectAll').addEventListener('input', function(){
    const table = document.getElementById('displayTableBody');
    table.querySelectorAll('input').forEach((input) => {
        input.checked = this.checked;
    });
    bookRecordsSelected = bookRecordsSelected.map(() => this.checked);

    if (this.checked)
    {
        const rows = table.querySelectorAll('.order');
        for (var i = 0; i < rows.length; i++){
            rows[i].innerHTML = "no." + (i+1).toString();
        }
        document.getElementById("writeData").innerHTML = "上載 " + bookRecords.length + " 項記錄";
    }
    else
    {
        table.querySelectorAll('.order').forEach((order) => {
            order.innerHTML = '/';
        });
        document.getElementById("writeData").innerHTML = "上載 0 項記錄";
    }
});

document.getElementById('displayTable').querySelector('thead').querySelectorAll('select').forEach((select) => {
    select.addEventListener('change', function(){
        //const index = parseInt(this.getAttribute('data-col'));
        const val = this.value;
        document.getElementById('displayTable').querySelector('thead').querySelectorAll('select').forEach((s) => {
            if (s.getAttribute('data-col') != this.getAttribute('data-col') && s.value == val)
            {
                s.value = 'def';
            }
        });
    });
});

async function query(q, type)
{
    var div = document.getElementById('resultList');
    div.innerHTML = '搜尋中';
    var resultHTML = '';
    var dataScore = structuredClone(Object.values(data));
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
            default:
                doc.score = 1;
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
var bookRecordsSelected = [];
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

    var time = new Date().getTime().toString();

    var records = {};
    for (var i = skipped, o = 0; i < bookRecords.length; i++){
        if (!bookRecordsSelected[i] || bookRecords[i].length < 1) {continue;}
        //console.log(bookRecords[i].length);
        //writeBookRecord(bookRecords[i][0], bookRecords[i][1], bookRecords[i][2], bookRecords[i][3], bookRecords[i][4], bookRecords[i][5], '');
        var record = createBookRecord(bookRecords[i]);
        record.key = time + "_" + (record.key == '' ? db.collection("version").doc().id : record.key) + "_" + (o++).toString();
        records[record.key] = record.data;
        //console.log(record);
        //data.push;
    }
    //console.log(Object.keys(records).length);
    //console.log(records);
    /*db.collection("books").doc("records").update(records)
    .then(() => {
        console.log("Document successfully updated!");
    });*/
    var batch = db.batch();
    var recordsRef = db.collection("books").doc("records");
    batch.update(recordsRef, records);
    var versionRef = db.collection("version").doc("version");
    batch.update(versionRef, {version: firebase.firestore.FieldValue.increment(1)});
    var logRef = db.collection("books").doc("log");
    //var logged = {time: firebase.firestore.FieldValue.serverTimestamp(), type: "add", data: JSON.stringify(records)};
    //batch.update(logRef, {log: firebase.firestore.FieldValue.arrayUnion(logged)});
    
    var randomId = db.collection("version").doc().id + "_" + time;
    var logged = {};
    logged[randomId] = {
        time: firebase.firestore.FieldValue.serverTimestamp(), 
        type: "add", 
        data: JSON.stringify(records)
    };
    batch.update(logRef, logged);
    /*batch.commit().then(() => {
        console.log("Document successfully updated!");
    });*/
    //localStorage.setItem('data', JSON.stringify(data));
 });

await getBookRecords();

const params = new URLSearchParams(document.location.search);
document.getElementById('searchInput').value = params.get('searchInput');
document.getElementById('searchType').value = params.get('searchType') == null ? 'title' : params.get('searchType');
query(params.get('searchInput'), params.get('searchType'));
//localStorage.setItem('data', JSON.stringify(data));
//var loaded = localStorage.getItem('data') != null ? JSON.parse(localStorage.getItem('data')) : getDataFromFile();
//var loaded = await getDataFromFile();
//console.log(loaded);