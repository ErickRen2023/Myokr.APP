// cycle.type: 1=monthly 2=bimonthly 3=quarterly 4=half_year 5=yearly
export enum CycleType {
  Monthly = 1,
  Bimonthly = 2,
  Quarterly = 3,
  HalfYear = 4,
  Yearly = 5,
}

// cycle/objective/key_result.status: 0=active 1=archived
export enum Status {
  Active = 0,
  Archived = 1,
}

// key_result.type: 1=numeric 2=milestone 3=boolean
export enum KRType {
  Numeric = 1,
  Milestone = 2,
  Boolean = 3,
}
