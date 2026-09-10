import connect from '../local-status-board-client.cjs';
import runner from './migrate-legacy.cjs';
import {buildStageTimingSql} from './schema.mjs';
const {c,workspaceId}=await connect();
try {
 const mode=process.argv.includes('--apply')?'apply':process.argv.includes('--verify')?'verify':'plan';
 console.log(JSON.stringify(await runner.migrate(c,workspaceId,mode,buildStageTimingSql('gainge_workspace'))));
}finally{await c.end()}
