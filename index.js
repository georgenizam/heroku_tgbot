const Telegraf = require('telegraf');
const download = require('download-file');
const WitSpeech = require('node-witai-speech');
const request = require('request-promise');
const cherio = require('cherio');
const moment = require('moment');
const data = require('./config');
const session = require('telegraf/session');
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base');
const kb = require('./util/keyboard-buttons');
const keyboard = require('./util/keyboard');
const fs =require('fs');
const {Pool, Client} = require('pg');


const uri = `https://api.wit.ai/speech`;



const { leave } = Stage;
const stage = new Stage();
const bot = new Telegraf(data.TOKEN);

stage.command('cancel', leave());

// Greeter scene
const start = new Scene('start');
const reg = new Scene('reg');
const regTeach = new Scene('regTeach');
const regStud = new Scene('regStud');
const task = new Scene('task');
const review = new Scene('review');


// Scene registration
stage.register(start);
stage.register(reg);
stage.register(task);
stage.register(review);
stage.register(regTeach);
stage.register(regStud);


start.enter(async (ctx) => {
    let text = `Здравствуйте ${ctx.from.first_name + ' ' + ctx.from.last_name} \nВыберите команду для начала работы:`;
    ctx.reply(
        text, {
            reply_markup: {
                keyboard: keyboard.home,
                remove_keyboard: true
            }
        }
    );
    //ctx.scene.leave()
});
//start.leave((ctx) => ctx.reply('Bye'));
//greeter.hears(/hi/gi, leave());
start.on('text', (ctx) => {

    console.log(ctx.message.text);

    switch (ctx.message.text) {
        case kb.home.registration:
            registration(ctx);

            break;
        case kb.home.task:
            //task(ctx);
            break;
        case kb.home.score:

            break;
        case kb.home.review:
            //review(ctx);
            reviewFunc(ctx);
            break;
        case kb.back:
            ctx.reply('Для начала работы выберите команду:', {
                reply_markup: {
                    keyboard: keyboard.home
                }
            });
            break;
        default:
            console.log('default message');
            break;
    }
});



// Create scene manager

console.log('bot started...');


bot.use(session());
bot.use(stage.middleware());

//bot.command('start', (ctx) => ctx.scene.enter('start'));
bot.on('message', async (ctx) => {
    ctx.scene.enter(('start'));
});


bot.startPolling();






function registration(ctx) {
    ctx.scene.enter('reg');

    reg.enter(async (ctx) => {
        ctx.reply('Выберите тип участника', {
            reply_markup: {
                keyboard: keyboard.reg
            },
        });
        //await ctx.scene.leave('getEduc');
        //await ctx.scene.leave('reg');
        //ctx.scene.enter('regTeach');
    });

    reg.on('text', async (ctx) => {
        console.log('reg');
        switch (ctx.message.text) {
            case kb.regStudTeach.teacher:
                regTeacher(ctx);
                break;
            case kb.regStudTeach.stud:
                regStudent(ctx);
                break;
            default:
                ctx.scene.enter('start');
        }
        //ctx.reply(     'Начнем заново. Введите имя, фамилию и отчество',     { reply_markup: { remove_keyboard: true } }   );
        //await ctx.scene.leave('reg');

        //ctx.scene.enter('start');
    });
}

function regTeacher(ctx) {
    ctx.scene.enter('regTeach');

    regTeach.enter(async (ctx) => {
        ctx.reply('Выберите пункт меню, затем введите данные тренера:', {
            reply_markup: {
                keyboard: keyboard.regTeach
            }
        });

        //await ctx.scene.leave('getEduc');
        //await ctx.scene.leave('reg');
        //ctx.scene.enter('regTeach');
    });

    regTeach.hears('Назад', async (ctx) => {
        //ctx.reply(     'Начнем заново. Введите имя, фамилию и отчество',     { reply_markup: { remove_keyboard: true } }   );
        //await ctx.scene.leave('getEduc');
        ctx.scene.enter('reg');
    });
    regTeach.hears('/start', async (ctx) => {
        ctx.scene.enter('start');
    });

}

function regStudent(ctx) {
    ctx.scene.enter('regStud');

    regStud.enter(async (ctx) => {
        ctx.reply('Выберите пункт меню, затем введите данные участника:', {
            reply_markup: {
                keyboard: keyboard.regStud
            }
        });
    });

    regStud.hears('Назад', async (ctx) => {
        //ctx.reply(     'Начнем заново. Введите имя, фамилию и отчество',     { reply_markup: { remove_keyboard: true } }   );
        //await ctx.scene.leave('getEduc');
        ctx.scene.enter('reg');
    });

    regStud.hears('/start', async (ctx) => {
        ctx.scene.enter('start');
    });


}

// function task({message}) {
//
// }

function score() {

}

function reviewFunc(ctx) {
    ctx.scene.enter('review');


    review.enter(async (ctx) => {
        let text = 'Оставьте свой отзыв в письменном или аудио формате';
        ctx.reply(
            text, {
                reply_markup: {
                    keyboard: keyboard.reviewKb,
                    //remove_keyboard: true
                }
            }
        );
    });

    review.hears('Назад', async (ctx) => {
        //ctx.reply(     'Начнем заново. Введите имя, фамилию и отчество',     { reply_markup: { remove_keyboard: true } }   );
        //await ctx.scene.leave('getEduc');
        ctx.scene.enter('start');
    });

    review.on('voice', async (ctx) => {

        //console.log(ctx.message);

        let {file_id: fileID} = ctx.message.voice;
        let urlFile = `https://api.telegram.org/bot${data.TOKEN}/getFile?file_id=${fileID}`;

        let date = ctx.message.date.toString();
        date = moment(date, "X").format(' DD-MM-YYYY--kk.mm.ss').toString();

        const userInfo = ctx.message.from;
        const userId = userInfo.id;
        const userDir = data.REVIEWS + userId + '/audio';




        await request(urlFile, (error, response, body) => {
            if (!error && response.statusCode === 200) { // успешный запрос
                if (!fs.existsSync(`${data.REVIEWS + userId}`))
                    fs.mkdirSync(`${data.REVIEWS + userId}`);

                if (!fs.existsSync(userDir)) // проверка на наличие директориии пользователя
                    fs.mkdirSync(userDir);

                const $ = cherio.load(body);
                let fileInfo = JSON.parse($.text());
                //console.log(date);
                const file_path = fileInfo.result.file_path;
                const file_exp = file_path.substr(file_path.search(/\./), file_path.length - file_path.search(/\./));
                let url = 'https://api.telegram.org/file/bot' + data.TOKEN + '/' + file_path;
                //console.log(url);
                download(url, {directory: userDir, filename: `${userId + date + file_exp}`}, function(err) {
                    if (err) throw err;
                    console.log("meow");
                    //audio = fs.readFileSync(`${userDir}/${userId + date + file_exp}`, "binary");
                });

            }
            else console.log('error to connect with telegram server');
        });

        console.log(typeof audio);

        // const resp = request.post({
        //     uri,
        //     headers: {
        //         'Accept': 'audio/x-mpeg-3',
        //         'Authorization': `Bearer ` + data.WITAI_TOKEN,
        //         'Content-Type': 'audio/mpeg3',
        //         'Transfer-Encoding': 'chunked'
        //     },
        //     audio
        // });
        //
        // const tex = JSON.parse(resp)._text;
        // console.log(tex);
    });

    review.on('text', async (ctx) => {
        const userInfo = ctx.message.from;
        const userId = userInfo.id;
        const userDir = data.REVIEWS + userId + '/text/';
        const file_exp = '.txt';
        let date = ctx.message.date.toString();
        date = moment(date, "X").format('DD-MM-YYYY--kk.mm.ss').toString();

        if (!fs.existsSync(`${data.REVIEWS + userId}`))
            fs.mkdirSync(`${data.REVIEWS + userId}`);

        if (!fs.existsSync(userDir)) // проверка на наличие директориии пользователя
            fs.mkdirSync(userDir);

        const text = ctx.message.text;
        fs.writeFile(`${userDir + userId + date + file_exp}`, text, function(err, data) {
            if (err) throw error; // если возникла ошибка
        });


    });

    //await ctx.scene.leave('getReview');
    //fs.mkdirSync(`${helper.getChatId(message)}`);

}

