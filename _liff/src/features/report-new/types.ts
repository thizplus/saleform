export interface ContactInput {
  name: string
  phone: string
  contactType: string // ผู้มุ่งหวังใหม่, ลูกค้าเก่า, ไม่พบผู้มีอำนาจตัดสินใจ
  authority: string   // มีอำนาจตัดสินใจ, ไม่มีอำนาจ
}

export interface CreateSiteForm {
  phone: string
  customerName: string
  customerType: string
  contractorName: string
  decisionMaker: string
  stage: string
  detail: string
  lat: number | null
  lng: number | null
  address: string
  tambon?: string
  amphoe?: string
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
  decisionMakers: string[]
  stages: string[]
  lostReasons: string[]
  competitors: string[]
  vehiclePlates: string[]
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
