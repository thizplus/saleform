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
  expectedOrderDate: string
  nextFollowUpDate: string
  photoIds: string[]
  forceNew: boolean
}

export interface OptionsData {
  customerTypes: string[]
  decisionMakers: string[]
  stages: string[]
  lostReasons: string[]
  competitors: string[]
}

export interface DuplicateMatch {
  siteCode: string
  customerName: string
  phone: string
  reason: string
  distanceM?: number
  ownerName: string
  status: string
}

export interface UploadedPhoto {
  id: string
  thumbUrl: string
  file?: File
}
