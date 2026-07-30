import {
  addAsset as addAssetRecord,
  deleteAsset as deleteAssetRecord,
} from '../services/assetService.js'

export async function addAsset(req, res) {
  const asset = await addAssetRecord(req.params.id, req.body, req.user)
  res.status(201).json({ data: asset })
}

export async function deleteAsset(req, res) {
  const data = await deleteAssetRecord(req.params.id, req.user)
  res.status(200).json({
    data,
    message: 'Asset eliminado correctamente.',
  })
}
