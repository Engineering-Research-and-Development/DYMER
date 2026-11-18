const express = require('express');

const router = express.Router();

const util = require('../utility');

const mcpController =
    require('../controllers/mcpController');

router.get(
    '/tools',
    util.checkIsAdmin,
    mcpController.listTools
);

router.get(
    '/agent/:agentId/tools',
    util.checkIsAdmin,
    mcpController.getAgentTools
);

router.post(
    '/agent/:agentId/call-tool',
    util.checkIsAdmin,
    mcpController.callAgentTool
);

router.post(
    '/agent/:agentId/test-chat',
    util.checkIsAdmin,
    mcpController.testAgentChat
);

router.post(
    '/agent/:agentId/test-deterministic',
    util.checkIsAdmin,
    mcpController.testDeterministicChat
);

router.post(
    '/test-tool',
    util.checkIsAdmin,
    mcpController.testTool
);

module.exports = router;