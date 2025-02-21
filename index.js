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

async function query(q, type, pageNumber)
{
    const entriesPerPage = 50;
    q = q == null ? '' : q;
    type = type == null ? 'title' : type;
    pageNumber = pageNumber == null ? 1 : parseInt(pageNumber);
    var div = document.getElementById('resultList');
    div.innerHTML = '搜尋中';
    var resultHTML = '';
    var dataScore = structuredClone(Object.values(data)).filter(function (el) {
        return (!el.hasOwnProperty('visible')) || ((el.visible) == "true");
    });
    console.log(typeof(data));
    dataScore.forEach((doc) => {
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
    var entries = dataScore.filter((doc) => doc.score > 0);
    entries.sort((a, b) => b.score - a.score);

    var pages = document.getElementById('pageSection');
    pages.innerHTML = '';
    if (pageNumber > 1)
    {
        pages.innerHTML += `<a href="?searchInput=${q}&searchType=${type}&pageNumber=${1}">&lt&lt</a>`;
        pages.innerHTML += `<a href="?searchInput=${q}&searchType=${type}&pageNumber=${pageNumber-1}">&lt</a>`;
    }
    for (var i = Math.max(1, pageNumber - 2); i < pageNumber; i++)
    {
        pages.innerHTML += `<a href="?searchInput=${q}&searchType=${type}&pageNumber=${i}">${i}</a>`;
    }
    pages.innerHTML += ` <a href="?searchInput=${q}&searchType=${type}&pageNumber=${pageNumber}" class="active">${pageNumber}</a>`;
    console.log(pageNumber + 1)
    console.log(Math.min(Math.ceil(entries.length / entriesPerPage), pageNumber + 3));
    for (var i = pageNumber + 1; i <= Math.min(Math.ceil(entries.length / entriesPerPage), pageNumber + 2); i++)
    {
        console.log(i);
        pages.innerHTML += `<a href="?searchInput=${q}&searchType=${type}&pageNumber=${i}">${i}</a>`;
    }
    if (pageNumber < Math.ceil(entries.length / entriesPerPage))
    {
        pages.innerHTML += `<a href="?searchInput=${q}&searchType=${type}&pageNumber=${pageNumber+1}">&gt</a>`;
        pages.innerHTML += `<a href="?searchInput=${q}&searchType=${type}&pageNumber=${Math.ceil(entries.length / entriesPerPage)}">&gt&gt</a>`;
    }
    console.log(pages.innerHTML);
    for (var i = (pageNumber - 1) * entriesPerPage; i < Math.min(pageNumber * entriesPerPage, entries.length); i++)
    {
        var doc = entries[i];
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
                        <td>書籍序號(B...)</td>
                        <td>${doc.rID}</td>
                    </tr>
                    <tr>
                        <td>索書號</td>
                        <td>${doc.cNum1}</td>
                    </tr>
                    <tr>
                        <td>作者號</td>
                        <td>${doc.cNum2}</td>
                    </tr>
                    <tr>
                        <td>資訊</td>
                        <td>${doc.notes}</td>
                    </tr>
                </tbody>
            </table>
            <hr>
        </div>
        `;
    }

    var pageBottom = document.getElementById('pageSectionBottom');
    pageBottom.innerHTML = pages.innerHTML;
    
    /*entries.forEach((doc) => {
        
    });*/
    div.innerHTML = resultHTML;

    document.getElementById('res').innerHTML = `搜尋結果: ${entries.length} 筆 | 顯示第${pageNumber}頁 (${(pageNumber - 1) * entriesPerPage + 1} - ${Math.min(pageNumber * entriesPerPage, entries.length)})`;
}

var data = [];

await getBookRecords();

const params = new URLSearchParams(document.location.search);
document.getElementById('searchInput').value = params.get('searchInput');
document.getElementById('searchType').value = params.get('searchType') == null ? 'title' : params.get('searchType');
query(params.get('searchInput'), params.get('searchType'), params.get('pageNumber'));
//console.log(document.location.search);
//localStorage.setItem('data', JSON.stringify(data));
//var loaded = localStorage.getItem('data') != null ? JSON.parse(localStorage.getItem('data')) : getDataFromFile();
//var loaded = await getDataFromFile();
//console.log(loaded);