const ROOTS ={
  ADMIN:'/admin',
  CONSULTANT:'/consultant',
}


export const PATHS = {
  ROOTS,
  admin: {
    salaries: {
      list:{
        link: `${ROOTS.ADMIN}/salaries`,
      },
      create:{
        link: `${ROOTS.ADMIN}/salaries/new`,
      },
    },
    trackers: {
      list:{
        link: `${ROOTS.ADMIN}/trackers`,
      },
      create:{
        link: `${ROOTS.ADMIN}/trackers/new`,
      },
    },
    rechargeable_expenses:{
      base: {
        link: `${ROOTS.ADMIN}/rechargeable-expenses`,
      },
      list: {
        link: `${ROOTS.ADMIN}/rechargeable-expenses`,
      },
      create: {
        link: `${ROOTS.ADMIN}/rechargeable-expenses/new`,
      },
      details: {
        link: (id: string) => `${ROOTS.ADMIN}/rechargeable-expenses/${id}`,
      },
      edit: {
        link: (id: string) => `${ROOTS.ADMIN}/rechargeable-expenses/${id}/edit`,
      },
    },
    import_document: {
      list:{
        link: `${ROOTS.ADMIN}/import-documents`,
      },
      create:{
        link: `${ROOTS.ADMIN}/import-documents/new`,
      },
      details: {
        link: (id: string|number) => `${ROOTS.ADMIN}/import-documents/${id}`,
      }
    },
    export_document: {
      list:{
        link: `${ROOTS.ADMIN}/export-documents`,
      },
      create:{
        link: `${ROOTS.ADMIN}/export-documents/new`,
      },
      details: {
        link: (id: string|number) => `${ROOTS.ADMIN}/import-documents/${id}`,
      }
    }
  },

  consultant:{
    rechargeable_expenses:{
      base:{
        link: `${ROOTS.CONSULTANT}/rechargeable-expenses`,
      },
      list: {
        link: `${ROOTS.CONSULTANT}/rechargeable-expenses`,
      },
    },
    documents:{
      list:{
        link: `${ROOTS.CONSULTANT}/documents`,
      },
    },
  }

};