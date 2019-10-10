process.env.DEBUG='@slack/interactive-messages:*';
process.env.NODE_ENV='development';

const express = require('express');
const bodyparser = require('body-parser');
const { createMessageAdapter } = require('@slack/interactive-messages');

const signingSecret = process.env.SIGNING_SECRET;

const renderer = require('./src/renderer');
const slashCommandHandler = require('./src/slashCommandHandler');
const actionHandlers = require('./src/actionHandlers');

const app = express();

app.use('/slackuarto/render', renderer);

app.post('/slackuarto/commands',
            bodyparser.urlencoded({extended: false}),
            slashCommandHandler
);

const slackInteractions = createMessageAdapter(signingSecret);

for(let k in actionHandlers) {
    slackInteractions.action(actionHandlers[k].match, actionHandlers[k].handle);
}

app.use('/slackuarto/actions',
    slackInteractions.expressMiddleware());

app.get('/slackuarto/heartbeat', (req, res) => {
    res.json({
        status: 'ok'
    });
});

app.listen(3000, () => console.log('GO!'));