import { execFileSync } from 'node:child_process'

const ports = [5173, 7001, 7002]

function findPids(port) {
  try {
    return execFileSync('lsof', ['-ti', `tcp:${port}`], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .map((pid) => Number(pid.trim()))
      .filter(Boolean)
  } catch {
    return []
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

for (const port of ports) {
  const pids = findPids(port)

  if (pids.length === 0) {
    continue
  }

  for (const pid of pids) {
    try {
      process.kill(pid, 'SIGTERM')
      console.log(`Stopping process ${pid} on port ${port}`)
    } catch (error) {
      console.warn(`Could not stop process ${pid} on port ${port}:`, error.message)
    }
  }

  await sleep(500)

  for (const pid of findPids(port)) {
    try {
      process.kill(pid, 'SIGKILL')
      console.log(`Force stopped process ${pid} on port ${port}`)
    } catch (error) {
      console.warn(`Could not force stop process ${pid} on port ${port}:`, error.message)
    }
  }
}
