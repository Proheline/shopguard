import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useInspection(userId) {
  const [saving, setSaving] = useState(false)
  const [inspectionId, setInspectionId] = useState(null)

  // Create a new inspection record in the database
  const createInspection = useCallback(async (jobInfo) => {
    setSaving(true)
    const { data, error } = await supabase
      .from('inspections')
      .insert({
        tech_id: userId,
        customer_name: jobInfo.customerName,
        customer_phone: jobInfo.customerPhone,
        customer_email: jobInfo.customerEmail,
        vehicle_year: jobInfo.vehicleYear,
        vehicle_make: jobInfo.vehicleMake,
        vehicle_model: jobInfo.vehicleModel,
        vehicle_color: jobInfo.vehicleColor,
        vehicle_vin: jobInfo.vehicleVin,
        vehicle_mileage: jobInfo.vehicleMileage,
        vehicle_plate: jobInfo.vehiclePlate,
        ro_number: jobInfo.roNumber,
        inspection_date: formatDateForDB(jobInfo.inspectionDate),
      })
      .select()
      .single()

    setSaving(false)
    if (error) {
      console.error('Create inspection error:', error)
      return { error }
    }
    setInspectionId(data.id)
    return { data }
  }, [userId])

  // Update job info on an existing inspection
  const updateJobInfo = useCallback(async (id, jobInfo) => {
    const { error } = await supabase
      .from('inspections')
      .update({
        customer_name: jobInfo.customerName,
        customer_phone: jobInfo.customerPhone,
        customer_email: jobInfo.customerEmail,
        vehicle_year: jobInfo.vehicleYear,
        vehicle_make: jobInfo.vehicleMake,
        vehicle_model: jobInfo.vehicleModel,
        vehicle_color: jobInfo.vehicleColor,
        vehicle_vin: jobInfo.vehicleVin,
        vehicle_mileage: jobInfo.vehicleMileage,
        vehicle_plate: jobInfo.vehiclePlate,
        ro_number: jobInfo.roNumber,
        inspection_date: formatDateForDB(jobInfo.inspectionDate),
      })
      .eq('id', id)

    if (error) console.error('Update job info error:', error)
    return { error }
  }, [])

  // Save a single zone result (upsert — creates or updates)
  const saveZoneResult = useCallback(async (inspId, zoneId, sectionId, zoneData) => {
    if (!inspId) return { error: 'No inspection ID' }

    const { data, error } = await supabase
      .from('zone_results')
      .upsert({
        inspection_id: inspId,
        zone_id: zoneId,
        section_id: sectionId,
        statuses: zoneData.status || [],
        not_present: zoneData.notPresent || false,
        notes: zoneData.notes || '',
      }, {
        onConflict: 'inspection_id,zone_id',
      })
      .select()
      .single()

    if (error) console.error('Save zone error:', error)
    return { data, error }
  }, [])

  // Upload a photo and link it to a zone result
  const uploadPhoto = useCallback(async (inspId, zoneResultId, file) => {
    const ext = file.name.split('.').pop()
    const fileName = `${inspId}/${zoneResultId}/${Date.now()}.${ext}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('inspection-photos')
      .upload(fileName, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: uploadError }
    }

    // Create database record
    const { data, error: dbError } = await supabase
      .from('zone_photos')
      .insert({
        zone_result_id: zoneResultId,
        storage_path: fileName,
        file_name: file.name,
      })
      .select()
      .single()

    if (dbError) console.error('Photo record error:', dbError)
    return { data, error: dbError }
  }, [])

  // Get signed URL for a photo
  const getPhotoUrl = useCallback(async (storagePath) => {
    const { data } = await supabase.storage
      .from('inspection-photos')
      .createSignedUrl(storagePath, 3600) // 1 hour expiry

    return data?.signedUrl || null
  }, [])

  // Delete a photo
  const deletePhoto = useCallback(async (photoId, storagePath) => {
    await supabase.storage
      .from('inspection-photos')
      .remove([storagePath])

    await supabase
      .from('zone_photos')
      .delete()
      .eq('id', photoId)
  }, [])

  // Save signature and mark as completed/signed
  const saveSignature = useCallback(async (inspId, signatureData) => {
    const { error } = await supabase
      .from('inspections')
      .update({
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
        status: 'signed',
      })
      .eq('id', inspId)

    if (error) console.error('Save signature error:', error)
    return { error }
  }, [])

  // Mark inspection as completed (all zones done)
  const markComplete = useCallback(async (inspId) => {
    const { error } = await supabase
      .from('inspections')
      .update({ status: 'completed' })
      .eq('id', inspId)

    if (error) console.error('Mark complete error:', error)
    return { error }
  }, [])

  // Load a full inspection with all zone results and photos
  const loadInspection = useCallback(async (inspId) => {
    const { data: inspection, error: inspError } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', inspId)
      .single()

    if (inspError) {
      console.error('Load inspection error:', inspError)
      return { error: inspError }
    }

    const { data: zones, error: zonesError } = await supabase
      .from('zone_results')
      .select('*, zone_photos(*)')
      .eq('inspection_id', inspId)

    if (zonesError) {
      console.error('Load zones error:', zonesError)
      return { error: zonesError }
    }

    // Convert DB format back to frontend format
    const inspections = {}
    for (const zone of zones) {
      const photoUrls = []
      for (const photo of zone.zone_photos || []) {
        const url = await getPhotoUrl(photo.storage_path)
        if (url) {
          photoUrls.push({
            url,
            id: photo.id,
            storagePath: photo.storage_path,
          })
        }
      }

      inspections[zone.zone_id] = {
        status: zone.statuses || [],
        notPresent: zone.not_present,
        notes: zone.notes || '',
        photos: photoUrls,
      }
    }

    const jobInfo = {
      customerName: inspection.customer_name || '',
      customerPhone: inspection.customer_phone || '',
      customerEmail: inspection.customer_email || '',
      vehicleYear: inspection.vehicle_year || '',
      vehicleMake: inspection.vehicle_make || '',
      vehicleModel: inspection.vehicle_model || '',
      vehicleColor: inspection.vehicle_color || '',
      vehicleVin: inspection.vehicle_vin || '',
      vehicleMileage: inspection.vehicle_mileage || '',
      vehiclePlate: inspection.vehicle_plate || '',
      roNumber: inspection.ro_number || '',
      techName: inspection.profiles?.full_name || '',
      inspectionDate: formatDateFromDB(inspection.inspection_date),
    }

    setInspectionId(inspId)
    return {
      data: {
        inspection,
        jobInfo,
        inspections,
        signature: inspection.signature_data || null,
      }
    }
  }, [getPhotoUrl])

  // List all inspections for this tech
  const listInspections = useCallback(async () => {
    const { data, error } = await supabase
      .from('inspections')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('List inspections error:', error)
    return { data: data || [], error }
  }, [])

  // Delete an inspection
  const deleteInspection = useCallback(async (inspId) => {
    // Photos in storage get orphaned — clean up
    const { data: zones } = await supabase
      .from('zone_results')
      .select('zone_photos(storage_path)')
      .eq('inspection_id', inspId)

    if (zones) {
      const paths = zones.flatMap(z =>
        (z.zone_photos || []).map(p => p.storage_path)
      )
      if (paths.length > 0) {
        await supabase.storage.from('inspection-photos').remove(paths)
      }
    }

    const { error } = await supabase
      .from('inspections')
      .delete()
      .eq('id', inspId)

    if (error) console.error('Delete inspection error:', error)
    else setInspectionId(null)
    return { error }
  }, [])

  return {
    saving,
    inspectionId,
    setInspectionId,
    createInspection,
    updateJobInfo,
    saveZoneResult,
    uploadPhoto,
    getPhotoUrl,
    deletePhoto,
    saveSignature,
    markComplete,
    loadInspection,
    listInspections,
    deleteInspection,
  }
}

// Convert MM/DD/YYYY to YYYY-MM-DD for Postgres
function formatDateForDB(dateStr) {
  if (!dateStr) return null
  const parts = dateStr.split('/')
  if (parts.length === 3) {
    return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
  }
  return dateStr
}

// Convert YYYY-MM-DD from Postgres to MM/DD/YYYY
function formatDateFromDB(dateStr) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}/${parts[0]}`
  }
  return dateStr
}