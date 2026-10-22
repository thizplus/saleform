export interface ContactInput {
  name: string
  phone: string
  contactType: string // ผู้มุ่งหวังใหม่, ลูกค้าเก่า, ไม่แน่ใจ
  authority: string   // มีอำนาจตัดสินใจ, ไม่มีอำนาจ, ไม่แน่ใจ
  role: string        // เจ้าของ, ช่าง, ไม่แน่ใจ
}

export interface CreateSiteForm {
  phone: string
  customerName: string
  customerType: string
  contractorName: string
  stage: string
  detail: string
  jobType: string
  jobTypeOther: string
  jobDetail: string
  lat: number | null
  lng: number | null
  tambon?: string
  amphoe?: string
  province?: string
  postcode?: string
  expectedOrderDate: string
  nextFollowUpDate: string
  photoIds: string[]
  contacts: ContactInput[]
  forceNew: boolean
  idempotencyKey?: string
  groupId?: string
}

export interface OptionsData {
  customerTypes: string[]
  stages: string[]
  lostReasons: string[]
  competitors: string[]
  vehiclePlates: string[]
  jobTypes: string[]
}

export interface DuplicateMatch {
  siteCode: string
  customerName: string
  phone: string
  reason: string
  distanceM?: number
  ownerName: string
  status: string
  isMine: boolean
}

export interface UploadedPhoto {
  id: string
  thumbUrl: string
  file?: File
}
