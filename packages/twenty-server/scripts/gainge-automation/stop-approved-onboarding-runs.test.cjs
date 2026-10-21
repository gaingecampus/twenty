const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  stoppedState,
  ids,
  workflowId,
  oldVersionId,
} = require('./stop-approved-onboarding-runs.cjs');
const fixture = () => ({
  id: ids[0],
  workflowId,
  workflowVersionId: oldVersionId,
  status: 'RUNNING',
  startedAt: '2026-10-04T18:00:00Z',
  state: {
    flow: {
      steps: [
        { id: 'loop', type: 'ITERATOR' },
        { id: 'update', type: 'UPDATE_RECORD' },
      ],
    },
    stepInfos: {
      loop: { status: 'RUNNING', result: { index: 3 } },
      update: { status: 'SUCCESS', result: { saved: true } },
    },
  },
});
test('preserves outputs and input while stopping the orphan iterator', () => {
  const run = fixture();
  const result = stoppedState(run);
  assert.equal(result.stepInfos.loop.status, 'STOPPED');
  assert.deepEqual(result.stepInfos.update, run.state.stepInfos.update);
  assert.deepEqual(result.stepInfos.loop.result, { index: 3 });
  assert.equal(run.state.stepInfos.loop.status, 'RUNNING');
});
test('rejects other runs, workflows, versions, dates and active business steps', () => {
  for (const change of [
    { id: 'other' },
    { workflowId: 'other' },
    { workflowVersionId: 'other' },
    { startedAt: '2026-10-21T05:39:00Z' },
    { status: 'COMPLETED' },
  ])
    assert.throws(() => stoppedState({ ...fixture(), ...change }));
  const run = fixture();
  run.state.stepInfos.update.status = 'RUNNING';
  assert.throws(() => stoppedState(run), /Active non-iterator/);
});
test('repeated cleanup is idempotent', () => {
  const run = fixture();
  run.state = stoppedState(run);
  run.status = 'STOPPED';
  assert.deepEqual(stoppedState(run), run.state);
  assert.equal(new Set(ids).size, 21);
});
