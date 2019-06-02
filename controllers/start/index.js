const { ContextMessageUpdate } = require('telegraf');
const Stage = require('telegraf/stage');
const Scene = require('telegraf/scenes/base');
const kb = require('../../util/keyboard-buttons');
const keyboard = require('../../util/keyboard');

const { leave } = Stage;
const start = new Scene('start');

start.enter(async (ctx = ContextMessageUpdate) => {
    const uid = String(ctx.from.id);
    const user = await User.findById(uid);
    const { mainKeyboard } = getMainKeyboard(ctx);

    if (user) {
        await ctx.reply(ctx.i18n.t('scenes.start.welcome_back'), mainKeyboard);
    } else {
        logger.debug(ctx, 'New user has been created');
        const now = new Date().getTime();

        const newUser = new User({
            _id: uid,
            created: now,
            username: ctx.from.username,
            name: ctx.from.first_name + ' ' + ctx.from.last_name,
            observableMovies: [],
            lastActivity: now,
            totalMovies: 0
        });

        await newUser.save();
        await ctx.reply('Choose language / Выбери язык', getLanguageKeyboard());
    }
});

start.leave(async (ctx = ContextMessageUpdate) => {
    const { mainKeyboard } = getMainKeyboard(ctx);

    await ctx.reply(ctx.i18n.t('shared.what_next'), mainKeyboard);
});

// start.command('saveme', leave());
// start.action(/languageChange/, languageChangeAction);
// start.action(/confirmAccount/, async (ctx = ContextMessageUpdate, next() => {
//     await ctx.answerCbQuery();
//     ctx.scene.leave();
// });

//export default start;