import {
  changeLaunchStatus,
  createLaunch as createLaunchRecord,
  deleteLaunch as deleteLaunchRecord,
  getLaunchById,
  getLaunchHistory,
  listLaunches,
  updateLaunch as updateLaunchRecord,
} from '../services/launchService.js'

export async function getLaunches(req, res) {
  const { launches, meta } = await listLaunches(req.query, req.user)
  res.status(200).json({ data: launches, meta })
}

export async function getLaunch(req, res) {
  const launch = await getLaunchById(req.params.id, req.user)
  res.status(200).json({ data: launch })
}

export async function createLaunch(req, res) {
  const launch = await createLaunchRecord(req.body, req.user)
  res.status(201).json({ data: launch })
}

export async function updateLaunch(req, res) {
  const launch = await updateLaunchRecord(req.params.id, req.body, req.user)
  res.status(200).json({ data: launch })
}

export async function deleteLaunch(req, res) {
  const data = await deleteLaunchRecord(req.params.id, req.user)
  res.status(200).json({
    data,
    message: 'Launch deleted successfully.',
  })
}

export async function updateLaunchStatus(req, res) {
  const launch = await changeLaunchStatus(req.params.id, req.body, req.user)
  res.status(200).json({ data: launch })
}

export async function getHistory(req, res) {
  const history = await getLaunchHistory(req.params.id, req.user)
  res.status(200).json({ data: history })
}
