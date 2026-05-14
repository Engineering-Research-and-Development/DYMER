const util = require('../utility');
const jsonResponse = require('../jsonResponse');
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");
const logger = require('./dymerlogger');
const fs = require('fs');
const readline = require('readline');

require("../models/agent/Agent.js");
const aiAgentController = require('../controllers/aiAgentController');
const agentModel = mongoose.model("Agent");

const nameFile = path.basename(__filename);
let router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));


// router.get('/getAllAgents', async (req, res) => {
// 	try {
//             const agents = await AiAgent.find().sort({ createdAt: -1 });
//             res.json(agents);
//         } catch (error) {
//             res.status(500).json({ message: "Errore recupero agenti", error: error.message });
//         }
// });

router.get("/getAllAgents", util.checkIsDymerUser, async function (req, res) {

    logger.info(`${nameFile} | getAllAgents`);

    let ret = new jsonResponse();
    const dymeruser = util.getDymerUser(req, res);
    if (!dymeruser || !dymeruser.email) {
        ret.setSuccess(false);
        ret.setMessages("User not authenticated or email not found.");
        return res.status(401).send(ret);
    }
    try {
        const agents = await agentModel.find().sort({ createdAt: -1 });
            res.json(agents);
       
    } catch (err) {
        logger.error(`${nameFile} | /get-streams | Error retrieving streams: ${err}`);
        res.status(500).json({ message: "Errore recupero agenti", error: error.message });
    }
});

router.post('/createAgent', util.checkIsDymerUser, aiAgentController.createAgent);
router.delete('/:id', util.checkIsAdmin, aiAgentController.deleteAgent);
 
/*router.post('/', util.checkIsAdmin, aiAgentController.createAgent);
router.put('/:id', util.checkIsAdmin, aiAgentController.updateAgent);
router.delete('/:id', util.checkIsAdmin, aiAgentController.deleteAgent);
 router.put('/:id', util.checkIsAdmin, aiAgentController.updateAgent);
router.post('/test-connection', aiAgentController.testConnection);*/

router.put('/:id', util.checkIsAdmin, aiAgentController.updateAgent);

router.get('/status/:id', aiAgentController.checkAgentStatus);

router.post('/stream', aiAgentController.processStreamChat);

router.post('/stream_fake', async (req, res) => {
    const { agentId, prompt } = req.body;

    try {
        // 1. Il Proxy cerca le istruzioni per questo specifico agente
        const agent = await agentModel.findById(agentId);
        
        if (!agent) return res.status(404).send("Agente non trovato");

        // 2. SMISTAMENTO (Switching)
        // Qui il proxy decide: vado verso Ollama, OpenAI o un Custom?
        if (agent.provider === 'ollama') {
            // Usa baseUrl e model salvati nell'agente
            return handleOllamaStream(res, agent, prompt); 
        } 
        
        if (agent.provider === 'openai') {
            // Usa apiKey e model salvati nell'agente
            return handleOpenAIStream(res, agent, prompt);
        }

        if (agent.provider === 'custom') {
            // Chiama un'API esterna salvata in baseUrl
            return handleCustomAgentStream(res, agent, prompt);
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/tailLog/:filetype', util.checkIsAdmin, async (req, res) => {
  const filetype = req.params.filetype;
  if (filetype.includes('..') || filetype.includes('/') || filetype.includes('\\')) {
    return res.status(400).send("Invalid filename");
  }
  const filePath = path.join(__dirname, "..", "logs", `${filetype}.log`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Log file not found");
  }
  try {
    const MAX_LINES = 50;
    const lines = [];
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      terminal: false
    });
    for await (const line of rl) {
      lines.push(line);
      if (lines.length > MAX_LINES) {
        lines.shift();
      }
    }
    res.json({
      file: `${filetype}.log`,
      lines: lines,
      totalLines: lines.length
    });
  } catch (err) {
    logger.error(`${nameFile} | /tailLog | Error: ${err.message}`);
    res.status(500).json({ error: "Errore lettura log", details: err.message });
  }
});

module.exports = router;