var request = require('request');
var cheerio = require('cheerio');
var Table = require('cli-table');
var prompt = require('cli-input');
var colors = require('colors');
var fs = require('fs');

//Option
request = request.defaults({ jar: true });
var request_options = {
    'method': '',
    'url': '',
    'headers': {
        'Cookie': ''
    }
};
//Const
let base_url = "http://elearning.stikombinaniaga.ac.id";
let secure_login = "";
let cookie = ""
let name = ''

console.log(`
------------------------------------------
${'WELCOME TO UNBIN-ELEARNING CLI'.green}
------------------------------------------
Developer : ${"Muhamad Yusup Hamdani".black.bgGreen}
NPM       : 14177063

Note :
Ketik "help" untuk bantuan. 
`);

status = false;

var ps = prompt({ infinite: true, prompt: 'Command: >' });
ps.on('value', function(value, options, ps) {
    // do something with value

    if (value == 'help') {
        var table_help = new Table({
            head: ['Perintah', 'Deskripsi', 'Contoh']
        });
        table_help.push(
            ["login username:password", "Untuk Login", "123456:pass1234"], ["help", "Bantuan/Menampilkan halaman ini", ""], ["schedule", "Menampilkan jadwal kuliah hari ini", ""],
        );
        console.log(table_help.toString());

    } else if (value[0] == 'login') {
        if (cookie != "") {
            console.log("please logout.");

        } else {
            if (value.length > 1) {
                initial(value[1])
            } else {
                console.log("Username Password, Wajib!!".red);
            }
        }
    } else
    if (value == 'logout') {
        status = true
    } else
    if (value == 'clear') {
        console.clear()
    } else
    if (value == 'status') {
        console.log("Status: " + status);
        console.log("Cookie: " + cookie);
    } else if (value == 'schedule') {
        schedule()
    }
})

// instantiate
var table_jadwal_kuliah = new Table({
    head: ['Date', 'Mulai', 'Selesai', 'Mata Kuliah', 'Dosen']
});

function initial(auth) {
    request.get(base_url, (e, r, body) => {
        let $ = cheerio.load(body);

        secure_login = $('[name=_secure_login]').val();
        cookie = r.headers['set-cookie'][0];
        let _login = auth.split(':');
        login(_login[0], _login[1]);
    });
}


function login(username = '', password = '') {
    // console.log([secure_login, cookie]);

    let path = '/login/doLogin';
    let url = base_url + path;

    var options = {
        'method': 'POST',
        'url': url,
        'headers': {
            'Cookie': cookie
        },
        formData: {
            'cuserid': username,
            'cpassword': password,
            '_secure_login': secure_login,
            'csubmit': 'Login'
        }
    };

    request(options, function(error, response, body) {
        options.url = base_url + '/home';
        request(options, (e, r) => {
            let $ = cheerio.load(r.body);
            name = $('.sidenav').find('label[style="color:white"]').eq(0).text();
            if (name) {
                status = true;
                fs.writeFileSync('./cookie.txt', cookie);
                console.log("Login Berhasil.".green)
            } else {
                console.log("Login Gagal.".red)
            }
        })
    });
}


function schedule() {
    let path = '/student/schedule';
    request_options.method = "GET";
    request_options.url = base_url + path;
    request_options.headers.Cookie = cookie;
    // console.log(cookie);

    request(request_options, (e, r) => {
        let $ = cheerio.load(r.body);
        $('#content').find('table tbody tr').each(function() {
            let date = $(this).find('td').eq(0).text()
            let mulai = $(this).find('td').eq(1).text()
            let selesai = $(this).find('td').eq(2).text()
            let mata_kuliah = $(this).find('td').eq(3).text()
            let dosen = $(this).find('td').eq(4).text()

            let data = [date, mulai, selesai, mata_kuliah, dosen];

            table_jadwal_kuliah.push(data);
        })
        console.log('');
        console.log('Jadwal Kuliah Hari Ini.'.yellow);
        console.log(table_jadwal_kuliah.toString())
    })
}


ps.run();