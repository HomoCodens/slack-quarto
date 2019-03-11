process.env.DEBUG='@slack/interactive-messages:*';
process.env.NODE_ENV='development';

const express = require('express');
const bodyparser = require('body-parser');
const { createMessageAdapter } = require('@slack/interactive-messages');

const renderer = require('./src/renderer');
const slashCommandHandler = require('./src/slashCommandHandler');
const actionHandlers = require('./src/actionHandlers');

const app = express();

app.use('/slackuarto/render', renderer);

app.post('/slackuarto/commands',
            bodyparser.urlencoded({extended: false}),
            slashCommandHandler
);

const slackSigningSecret = '2589d910c0e367a92d2fefe5c88ab1c4';
const slackInteractions = createMessageAdapter(slackSigningSecret);

slackInteractions.action('dropdown', (payload, respond) => {
    console.log('options handler');
    console.log(payload);
});

for(let k in actionHandlers) {
    slackInteractions.action(actionHandlers[k].match, actionHandlers[k].handle);
}

app.use('/slackuarto/actions',
    slackInteractions.expressMiddleware());

app.listen(3000, () => console.log('GO!'));