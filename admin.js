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
    for (var d of Object.entries(data))
    {
        if (!d[1].hasOwnProperty('visible'))
        {
            d[1].visible = "true";
        }
        if (!d[1].hasOwnProperty('type'))
        {
            d[1].type = "take";
        }
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
        const cols = Math.max(7, Math.max.apply(Math, bookRecords.map(function(a) { return a.length; })));
        console.log(cols);
        for (var i = 0; i < cols; i++){
            uploadTable.querySelectorAll('select')[i].parentNode.style.display = '';
        }
        for (var i = cols; i < 20; i++){
            uploadTable.querySelectorAll('select')[i].parentNode.style.display = 'none';
        }
        document.getElementById("writeData").innerHTML = "上載 " + bookRecords.length + " 項記錄";
    };
    FR.readAsArrayBuffer(file);
}

var uploadTable = document.getElementById('displayTable').querySelector('thead');
uploadTable.innerHTML = `
<tr>
    <th>
        全選
        <input type="checkbox" id="selectAll" checked="checked">
    </th>
    <th>-</th>
<tr>
`;
for (var i = 0; i < 20; i++){
    uploadTable.querySelector('tr').innerHTML += `
    <th style="display:none">
        <select data-col="${i}">
            <option value="def"></option>
            <option value="rID">書籍序號(B...)</option>
            <option value="cNum1">索書號</option>
            <option value="cNum2">作者號</option>
            <option value="title">書名</option>
            <option value="author">作者</option>
            <option value="publisher">出版社</option>
            <option value="notes">簡介</option>
        </select>
    </th>
    `;
}
for (var i = 0; i < 20; i++){
    if (uploadTable.querySelectorAll('select')[i].options.length <= i + 1) {break;}
    uploadTable.querySelectorAll('select')[i].value = uploadTable.querySelectorAll('select')[i].options[i+1].value;
    uploadTable.querySelectorAll('select')[i].parentNode.style.display = '';
}

async function initEditTable()
{
    var entries = Object.entries(data);
    var table = document.getElementById('editTableBody');
    var entriesText = "";
    for (let i = 0; i < entries.length; i++) {
        entriesText += `
        <tr>
            <td>
                <textarea data-for="rID" data-store="${entries[i][1].rID}">${entries[i][1].rID}</textarea>
            </td>
            <td>
                <textarea data-for="cNum1" data-store="${entries[i][1].cNum1}">${entries[i][1].cNum1}</textarea>
            </td>
            <td>
                <textarea data-for="cNum2" data-store="${entries[i][1].cNum2}">${entries[i][1].cNum2}</textarea>
            </td>
            <td>
                <textarea data-for="title" data-store="${entries[i][1].title}">${entries[i][1].title}</textarea>
            </td>
            <td>
                <textarea data-for="author" data-store="${entries[i][1].author}">${entries[i][1].author}</textarea>
            </td>
            <td>
                <textarea data-for="publisher" data-store="${entries[i][1].publisher}">${entries[i][1].publisher}</textarea>
            </td>
            <td>
                <textarea data-for="notes" data-store="${entries[i][1].notes}">${entries[i][1].notes}</textarea>
            </td>
            <td>
                <button data-action="save" data-key="${entries[i][0]}">Save</button>
                <button data-action="reset"}>Reset</button>
            </td>
        </tr>
        `;
    }
    table.innerHTML += entriesText;
    console.log(entries.length);
    table.querySelectorAll("tr").forEach((tr) => {
        //const maxHeight = Math.max.apply(Math, Array.from(tr.querySelectorAll("textarea")).map(function(o) { return o.scrollHeight; }));
        tr.querySelectorAll("textarea").forEach(function(textarea) {
            textarea.style.height = "60px";
            textarea.style.overflow = "";

            textarea.addEventListener("input", function() {
                tr = this.parentNode.parentNode;
                /*tr.querySelectorAll("textarea").forEach(function(textarea) {
                    textarea.style.height = "auto";
                });
                const maxHeight = Math.max.apply(Math, Array.from(tr.querySelectorAll("textarea")).map(function(o) { return o.scrollHeight; }));
                tr.querySelectorAll("textarea").forEach(function(textarea) {
                    textarea.style.height = maxHeight + "px";
                });*/
                if (textarea.type == 'text' || textarea instanceof HTMLSelectElement)
                {
                    if (this.value == this.getAttribute('data-store'))
                    {
                        this.classList.remove('changed');
                    }
                    else
                    {
                        this.classList.add('changed');
                    }
                }
                else if (textarea.type == 'checkbox')
                {
                    if (this.checked.toString() == this.getAttribute('data-store'))
                    {
                        this.classList.remove('changed');
                    }
                    else
                    {
                        this.classList.add('changed');
                    }
                }
                var tr = textarea.parentNode.parentNode;
                tr.querySelector('[data-action="save"]').style.display = tr.querySelectorAll('.changed').length > 0 ? '' : 'none';
                tr.querySelector('[data-action="reset"]').style.display = tr.querySelectorAll('.changed').length > 0 ? '' : 'none';
            });
            /*textarea.addEventListener("focus", function() {
                this.removeAttribute('readonly');
            });
            textarea.addEventListener("blur", function() {
                this.setAttribute('readonly', 'readonly');
            });*/
            textarea.addEventListener("change", function() {
                console.log(textarea.value);
                if (this.type == 'text'|| textarea instanceof HTMLSelectElement)
                {
                    if (this.value == this.getAttribute('data-store'))
                    {
                        this.classList.remove('changed');
                    }
                    else
                    {
                        this.classList.add('changed');
                    }
                }
                else if (this.type == 'checkbox')
                {
                    if (this.checked.toString() == this.getAttribute('data-store'))
                    {
                        this.classList.remove('changed');
                    }
                    else
                    {
                        this.classList.add('changed');
                    }
                }
                
                var tr = textarea.parentNode.parentNode;
                tr.querySelector('[data-action="save"]').style.display = tr.querySelectorAll('.changed').length > 0 ? '' : 'none';
                tr.querySelector('[data-action="reset"]').style.display = tr.querySelectorAll('.changed').length > 0 ? '' : 'none';
            });
        });
        tr.querySelector('[data-action="save"]').addEventListener("click", async function() {
            var tr = this.parentNode.parentNode;
            var records = {};
            const key = this.getAttribute('data-key');
            tr.querySelectorAll(".changed").forEach(function(textarea) {
                records[`${key}.${textarea.getAttribute('data-for')}`] = textarea.value;
            });
            var time = new Date().getTime().toString();
            var batch = db.batch();

            var recordsRef = db.collection("books").doc("records");
            batch.update(recordsRef, records);
            var versionRef = db.collection("version").doc("version");
            batch.update(versionRef, {version: firebase.firestore.FieldValue.increment(1)});
            var logRef = db.collection("books").doc("log");
            
            var randomId = db.collection("version").doc().id + "_" + time;
            var logged = {};
            logged[randomId] = {
                time: firebase.firestore.FieldValue.serverTimestamp(), 
                type: "edit", 
                data: JSON.stringify(records)
            };
            batch.update(logRef, logged);
            batch.commit().then(async () => {
                console.log("Document successfully updated!");
                document.getElementById('uploadSingleStatus').innerHTML = "上載成功";
                var tr = this.parentNode.parentNode;
                tr.querySelectorAll(".changed").forEach(function(textarea) {
                    if (this.value == this.getAttribute('data-store'))
                    {
                        textarea.setAttribute('data-store', textarea.value);
                        textarea.classList.remove('changed');
                    }
                    else
                    {
                        textarea.setAttribute('data-store', textarea.checked);
                        textarea.classList.remove('changed');
                    }
                });
                tr.querySelector('[data-action="save"]').style.display = 'none';
                tr.querySelector('[data-action="reset"]').style.display = 'none'
                await getBookRecords();
                //await query(document.getElementById('searchInput').value, document.getElementById('searchType').value, document.getElementById('sortType').value);
            })
            .catch((error) => {
                console.error("Error updating document: ", error);
                document.getElementById('uploadSingleStatus').innerHTML = `上載失敗 (${error})`;
            }); 

        });
        tr.querySelector('[data-action="reset"]').addEventListener("click", function(){
            var tr = this.parentNode.parentNode;
            tr.querySelectorAll(".changed").forEach(function(textarea) {
                if (textarea.type == "text" || textarea instanceof HTMLSelectElement)
                {
                    textarea.value = textarea.getAttribute('data-store');
                }
                else if (textarea.type == "checkbox")
                {
                    if (!textarea.getAttribute('data-store'))
                    {
                        textarea.classList.remove('changed');
                    }
                    else
                    {
                        textarea.classList.add('changed');
                    }
                }
                textarea.classList.remove('changed');
            });
            tr.querySelector('[data-action="save"]').style.display = 'none';
            tr.querySelector('[data-action="reset"]').style.display = 'none';
        });
        console.log(table.querySelectorAll("tr").length);
    });
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

async function query(q, type, sort)
{
    var div = document.getElementById('resultList');
    div.innerHTML = '搜尋中';
    var resultHTML = '';
    var dataScore = structuredClone(Object.entries(data));
    console.log(dataScore);
    dataScore.forEach((doc) => {
        doc = doc[1];
        doc.score = 0;
        switch(type){
            case 'rID':
                if (doc.rID.toString().includes(q)) {doc.score += 1;}
                break;
            case 'cNum1':
                if (doc.cNum1.toString().includes(q)) {doc.score += 1;}
                break;
            case 'cNum2':
                if (doc.cNum2.toString().includes(q)) {doc.score += 1;}
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
    var entries = dataScore.filter((doc) => doc[1].score > 0);
    
    function rIDTransform(rID)
    {
        let v = rID.indexOf("B");
        if (v >= 0)
        {
            let s = rID.substring(v+1);
            if (!isNaN(s)) return Number(s);
        }
        return 99999;
    }
    function cNum1Transform(s)
    {
        s = String(s);
        let num = 99999999;
        if (s.match("^[0-9.]*$"))
        {
            var v = s.indexOf(".");
            if (v >= 0)
            {
                v = s.indexOf(".", v+1);
            }
            if (v >= 0) s = s.substring(0, v);
            if (!isNaN(s))
            {
                num = Number(s);
            }
            if (isNaN(num))
            {
                num = 99999999;
            }
        }
        return num;
    }
    function cNum2Transform(s)
    {
        if (!isNaN(s))
            {
                return Number(s);
            }
        return 99999;
    }
    switch(sort){
        case 'title_':
            entries.sort((a, b) => b[1].title.length - a[1].title.length );
            break;

        case 'title':
            entries.sort((a, b) => a[1].title.length - b[1].title.length );
            break;

        case 'rID_':
            entries.sort((a, b) => rIDTransform(b[1].rID) - rIDTransform(a[1].rID) );
            break;
            
        case 'rID':
            entries.sort((a, b) => rIDTransform(a[1].rID) - rIDTransform(b[1].rID) );
            break;
            
        case 'cNum1_':
            entries.sort((a, b) => cNum1Transform(b[1].cNum1) - cNum1Transform(a[1].cNum1) );
            break;
            
        case 'cNum1':
            entries.sort((a, b) => cNum1Transform(a[1].cNum1) - cNum1Transform(b[1].cNum1) );
            break;
            
        case 'cNum2_':
            entries.sort((a, b) => cNum2Transform(b[1].cNum2) - cNum2Transform(a[1].cNum2) );
            break;
            
        case 'cNum2':
            entries.sort((a, b) => cNum2Transform(a[1].cNum2) - cNum2Transform(b[1].cNum2) );
            break;
            
        default:
            entries.sort((a, b) => b[1].score - a[1].score);
            break;
    }

    
    entries.forEach((entry) => {
        var doc = entry[1];
        resultHTML += `
        <div style="display:block;" class="entry">
            <input type="text" data-for="title" data-store="${doc.title}" value="${doc.title}">
            <br>
            <input type="text" data-for="author" data-store="${doc.author}" value="${doc.author}">
            <br>
            <br>
            <table>
                <tbody>
                    <tr>
                        <td>出版</td>
                        <td><input type="text" data-for="publisher" data-store="${doc.publisher}" value="${doc.publisher}"></td>
                    </tr>
                    <tr>
                        <td>書籍序號(B...)</td>
                        <td><input type="text" data-for="rID" data-store="${doc.rID}" value="${doc.rID}"></td>
                    </tr>
                    <tr>
                        <td>索書號</td>
                        <td><input type="text" data-for="cNum1" data-store="${doc.cNum1}" value="${doc.cNum1}"></td>
                    </tr>
                    <tr>
                        <td>作者號</td>
                        <td><input type="text" data-for="cNum2" data-store="${doc.cNum2}" value="${doc.cNum2}"></td>
                    </tr>
                    <tr>
                        <td>資訊</td>
                        <td><input type="text" data-for="notes" data-store="${doc.notes}" value="${doc.notes}"></td>
                    </tr>
                    <tr>
                        <td>種類</td>
                        <td>
                            <select data-for="type" data-store="${doc.type}">
                                <option value="lend"${doc.type == "lend" ? ' selected="selected"' : ''}>外借圖書</option>
                                <option value="take"${doc.type == "take" ? ' selected="selected"' : ''}>漂書</option>
                                <option value="takein"${doc.type == "takein" ? ' selected="selected"' : ''}>漂書（館內）</option>
                                <option value="reference"${doc.type == "reference" ? ' selected="selected"' : ''}>參考圖書（不外借）</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <td>顯示</td>
                        <td><input type="checkbox" data-for="visible" data-store="${doc.visible}" ${doc.visible=="true" ? "checked" : ""}></td>
                    </tr>
                </tbody>
            </table>
            <button data-action="deleteFirst" style="float: right;">刪除</button>
            <button data-action="delete" data-key="${entry[0]}" style="display:none; float: right;">確認刪除</button>
            <button data-action="deleteCancel" style="display:none; float: right;">取消</button>
            <button data-action="save" data-key="${entry[0]}" style="visibility:hidden;">儲存修改</button>
            <button data-action="reset"} style="visibility:hidden;">重置修改</button>
            <hr>
        </div>
        `;
    });
    div.innerHTML = resultHTML;

    div.querySelectorAll(".entry").forEach((div) => {
        div.querySelectorAll("input,select").forEach(function(input) {
            input.addEventListener("input", function() {
                if (this.type == "button" || this instanceof HTMLSelectElement)
                {
                    if (this.value == this.getAttribute('data-store'))
                    {
                        this.classList.remove('changed');
                    }
                    else
                    {
                        this.classList.add('changed');
                    }
                }
                else
                {
                    if (this.checked.toString() == this.getAttribute('data-store'))
                    {
                        this.classList.remove('changed');
                    }
                    else
                    {
                        this.classList.add('changed');
                    }
                }
                
                var div = input.closest("div");
                div.querySelector('[data-action="save"]').style.visibility = div.querySelectorAll('.changed').length > 0 ? 'visible' : 'hidden';
                div.querySelector('[data-action="reset"]').style.visibility = div.querySelectorAll('.changed').length > 0 ? 'visible' : 'hidden';
                div.querySelector('[data-action="deleteFirst"]').style.display = div.querySelectorAll('.changed').length > 0 ? 'none' : '';
                div.querySelector('[data-action="delete"]').style.display = 'none';
                div.querySelector('[data-action="deleteCancel"]').style.display = 'none';
            });
            input.addEventListener("change", function() {
                console.log(this.type);
                if (this.type == "text" || this instanceof HTMLSelectElement)
                {
                    if (this.value == this.getAttribute('data-store'))
                    {
                        this.classList.remove('changed');
                    }
                    else
                    {
                        this.classList.add('changed');
                    }
                }
                else if (this.type == "checkbox")
                {
                    if (this.checked.toString() == this.getAttribute('data-store'))
                    {
                        this.classList.remove('changed');
                    }
                    else
                    {
                        this.classList.add('changed');
                    }
                }
                var div = input.closest("div");
                div.querySelector('[data-action="save"]').style.visibility = div.querySelectorAll('.changed').length > 0 ? 'visible' : 'hidden';
                div.querySelector('[data-action="reset"]').style.visibility = div.querySelectorAll('.changed').length > 0 ? 'visible' : 'hidden';
                div.querySelector('[data-action="deleteFirst"]').style.display = div.querySelectorAll('.changed').length > 0 ? 'none' : '';
                div.querySelector('[data-action="delete"]').style.display = 'none';
                div.querySelector('[data-action="deleteCancel"]').style.display = 'none';
            });
        });
        div.querySelector('[data-action="deleteFirst"]').addEventListener("click", function() {
            var div = this.parentNode;
            div.querySelector('[data-action="delete"]').style.display = '';
            div.querySelector('[data-action="deleteCancel"]').style.display = '';
            div.querySelector('[data-action="deleteFirst"]').style.display = 'none';
        });
        div.querySelector('[data-action="deleteCancel"]').addEventListener("click", function() {
            var div = this.parentNode;
            div.querySelector('[data-action="delete"]').style.display = 'none';
            div.querySelector('[data-action="deleteCancel"]').style.display = 'none';
            div.querySelector('[data-action="deleteFirst"]').style.display = '';
        });
        div.querySelector('[data-action="delete"]').addEventListener("click", async function() {
            const key = this.getAttribute('data-key');
            var records = {};
            records[key] = firebase.firestore.FieldValue.delete();
            var time = new Date().getTime().toString();
            var batch = db.batch();

            var recordsRef = db.collection("books").doc("records");
            batch.update(recordsRef, records);
            var versionRef = db.collection("version").doc("version");
            batch.update(versionRef, {version: firebase.firestore.FieldValue.increment(1)});
            var logRef = db.collection("books").doc("log");
            
            var randomId = db.collection("version").doc().id + "_" + time;
            var logged = {};
            logged[randomId] = {
                time: firebase.firestore.FieldValue.serverTimestamp(), 
                type: "delete", 
                data: JSON.stringify(key)
            };
            batch.update(logRef, logged);
            batch.commit().then(async () => {
                console.log("Document successfully updated!");
                document.getElementById('uploadSingleStatus').innerHTML = "上載成功";
                var div = this.parentNode;
                div.remove();
                await getBookRecords();
                await query(document.getElementById('searchInput').value, document.getElementById('searchType').value, document.getElementById('sortType').value);
            })
            .catch((error) => {
                console.error("Error updating document: ", error);
                document.getElementById('uploadSingleStatus').innerHTML = `上載失敗 (${error})`;
            }); 
        });
        div.querySelector('[data-action="save"]').addEventListener("click", function() {
            var div = this.parentNode;
            var records = {};
            const key = this.getAttribute('data-key');
            div.querySelectorAll(".changed").forEach(function(input) {
                if (input.type == "text" || input instanceof HTMLSelectElement)
                {
                    records[`${key}.${input.getAttribute('data-for')}`] = input.value;
                }
                else if (input.type == "checkbox")
                {
                    records[`${key}.${input.getAttribute('data-for')}`] = input.checked ? "true" : "false";
                }
            });
            var time = new Date().getTime().toString();
            var batch = db.batch();

            var recordsRef = db.collection("books").doc("records");
            batch.update(recordsRef, records);
            console.log(records);
            var versionRef = db.collection("version").doc("version");
            batch.update(versionRef, {version: firebase.firestore.FieldValue.increment(1)});
            var logRef = db.collection("books").doc("log");
            
            var randomId = db.collection("version").doc().id + "_" + time;
            var logged = {};
            logged[randomId] = {
                time: firebase.firestore.FieldValue.serverTimestamp(), 
                type: "edit", 
                data: JSON.stringify(records)
            };
            batch.update(logRef, logged);
            batch.commit().then(() => {
                console.log("Document successfully updated!");
                document.getElementById('uploadSingleStatus').innerHTML = "上載成功";
                var div = this.parentNode;
                div.querySelectorAll(".changed").forEach(function(input) {
                    if (input.type == 'text' || input instanceof HTMLSelectElement)
                    {
                        input.setAttribute('data-store', input.value);
                        input.classList.remove('changed');
                    }
                    else if (input.type == 'checkbox')
                    {
                        input.setAttribute('data-store', input.checked);
                        input.classList.remove('changed');
                    }
                });
                div.querySelector('[data-action="save"]').style.visibility = 'hidden';
                div.querySelector('[data-action="reset"]').style.visibility = 'hidden';
                div.querySelector('[data-action="deleteFirst"]').style.display = '';
            })
            .catch((error) => {
                console.error("Error updating document: ", error);
                document.getElementById('uploadSingleStatus').innerHTML = `上載失敗 (${error})`;
            }); 

        });
        div.querySelector('[data-action="reset"]').addEventListener("click", function(){
            var div = this.parentNode;
            div.querySelectorAll(".changed").forEach(function(textarea) {
                if (textarea.type == 'text' || textarea instanceof HTMLSelectElement)
                {
                    textarea.value = textarea.getAttribute('data-store');
                    textarea.classList.remove('changed');
                }
                else if (textarea.type == 'checkbox')
                {
                    textarea.checked = textarea.getAttribute('data-store');
                    textarea.classList.remove('changed');
                }
            });
            div.querySelector('[data-action="save"]').style.visibility = 'hidden';
            div.querySelector('[data-action="reset"]').style.visibility = 'hidden';
            div.querySelector('[data-action="deleteFirst"]').style.display = '';
        });
    });

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

document.getElementById('writeSingleData').addEventListener('click', function(e) {
    console.log('writeSingleData clicked');
    document.getElementById('uploadSingleStatus').innerHTML = "上載中";
    const entry = document.getElementById('uploadSection');
    var record = {
        key: entry.querySelector('[data-for="rID"]').value,
        data: {
            rID: entry.querySelector('[data-for="rID"]').value,
            cNum1: entry.querySelector('[data-for="cNum1"]').value,
            cNum2: entry.querySelector('[data-for="cNum2"]').value,
            title: entry.querySelector('[data-for="title"]').value,
            author: entry.querySelector('[data-for="author"]').value,
            publisher: entry.querySelector('[data-for="publisher"]').value,
            notes: entry.querySelector('[data-for="notes"]').value,
            visible: entry.querySelector('[data-for="visible"]').checked ? "true" : "false",
            type: entry.querySelector('[data-for="type"]').value
        }
    };
    
    var time = new Date().getTime().toString();

    var records = {};
    records[time + "_" + (record.key == '' ? db.collection("version").doc().id : record.key)] = record.data;

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
    batch.commit().then(() => {
        console.log("Document successfully updated!");
        document.getElementById('uploadSingleStatus').innerHTML = `上載成功 ${record.data.title}`;
        document.getElementById('uploadSingleHistory').innerHTML = `${new Date().toLocaleTimeString()}: ${record.data.title}<br>` + document.getElementById('uploadSingleHistory').innerHTML;
        document.getElementById('uploadSection').querySelectorAll('input').forEach((input) => {
            input.value = '';
        });
    })
    .catch((error) => {
        console.error("Error updating document: ", error);
        document.getElementById('uploadSingleStatus').innerHTML = `上載失敗 (${error})`;
    }); 
 });

 //upload book records to database listener
document.getElementById('writeData').addEventListener('click', function(e) {
    console.log('writeData clicked' + " " + bookRecords.length);
    document.getElementById('uploadStatus').innerHTML = "上載中";
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
    batch.commit().then(() => {
        console.log("Document successfully updated!");
        document.getElementById('uploadStatus').innerHTML = "上載成功";
    })
    .catch((error) => {
        console.error("Error updating document: ", error);
        document.getElementById('uploadStatus').innerHTML = `上載失敗 (${error})`;
    }); 

    //localStorage.setItem('data', JSON.stringify(data));
 });

 //choose section menu
document.getElementById('sectionMenu').querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', async function(e){
        await getBookRecords();
        document.getElementById('sectionMenu').querySelectorAll('button').forEach((b) => {
            b.classList.remove('selected');
        });
        button.classList.add('selected');
        document.getElementById('sectionContent').querySelectorAll('section').forEach((section) => {
            section.style.display = 'none';
        });
        document.getElementById(button.getAttribute('data-for')).style.display = '';
        await query(document.getElementById('searchInput').value, document.getElementById('searchType').value, document.getElementById('sortType').value);
        console.log("select")
        /*if (button.getAttribute('data-for')== 'editSection')
        {
            document.getElementById('editTableBody').querySelectorAll("tr").forEach((tr) => {
                tr.querySelector('textarea').dispatchEvent(new Event('input', { bubbles: true }));
            });
        }*/
    });
});
document.getElementById('sectionMenu').querySelector('button').click();

//reset fields of single record for upload
document.getElementById('resetSingleData').addEventListener('click', function(e) {
    console.log('resetSingleData clicked');
    document.getElementById('uploadSection').querySelectorAll('input').forEach((input) => {
        if (input.type == "text" || input instanceof HTMLSelectElement)
        {
            input.value = '';
        }
        else if (input.type == "checkbox")
        {
            input.checked = true;
        }
    });
 });

 //collapsible section
 for (let coll of document.getElementsByClassName("collapsible")) {
    coll.addEventListener("click", function() {
        this.classList.toggle("active");
        var content = this.nextElementSibling;
        if (content.style.display === "block") {
        content.style.display = "none";
        } else {
        content.style.display = "block";
        }
    });
}

//search button
document.getElementById('searchButton').addEventListener('click', async function(e) {
    console.log('searchButton clicked');
    await query(document.getElementById('searchInput').value, document.getElementById('searchType').value, document.getElementById('sortType').value);
});

//sort
document.getElementById('sortType').addEventListener('change', async function(e) {
    console.log('sorting changed');
    await query(document.getElementById('searchInput').value, document.getElementById('searchType').value, document.getElementById('sortType').value);
});

//preview
document.getElementById('preview').addEventListener('click', function(e) {
    console.log(this.checked ? "" : "none")
    document.getElementById('previewBox').style.display = (this.checked ? "" : "none")
});

await getBookRecords();
await query('', 'title', 'default');

/*Array.from(document.getElementById('editTableBody').querySelectorAll("tr")).slice().reverse().forEach((tr) => {
    tr.querySelector('textarea').dispatchEvent(new Event('input', { bubbles: true }));
});*/


/*const params = new URLSearchParams(document.location.search);
document.getElementById('searchInput').value = params.get('searchInput');
document.getElementById('searchType').value = params.get('searchType') == null ? 'title' : params.get('searchType');
query(params.get('searchInput'), params.get('searchType'));*/
//localStorage.setItem('data', JSON.stringify(data));
//var loaded = localStorage.getItem('data') != null ? JSON.parse(localStorage.getItem('data')) : getDataFromFile();
//var loaded = await getDataFromFile();
//console.log(loaded);