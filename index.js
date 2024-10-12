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
//#endregion

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

var data = [];

await getBookRecords();

const params = new URLSearchParams(document.location.search);
document.getElementById('searchInput').value = params.get('searchInput');
document.getElementById('searchType').value = params.get('searchType') == null ? 'title' : params.get('searchType');
query(params.get('searchInput'), params.get('searchType'));
//localStorage.setItem('data', JSON.stringify(data));
//var loaded = localStorage.getItem('data') != null ? JSON.parse(localStorage.getItem('data')) : getDataFromFile();
//var loaded = await getDataFromFile();
//console.log(loaded);