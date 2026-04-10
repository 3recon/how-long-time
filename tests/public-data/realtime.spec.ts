import assert from "node:assert/strict";

import {
  PublicDataApiError,
  mapPublicDataRealtimeItems,
  parsePublicDataRealtimeResponse,
} from "../../lib/server/public-data.ts";

const successPayload = {
  response: {
    header: {
      resultCode: "00",
      resultMsg: "NORMAL SERVICE.",
    },
    body: {
      items: [
        {
          csoNm: "종로구청 여권 민원실",
          taskNm: "4.여권신청",
          wtngCnt: "8",
          totDt: "20260410103000",
        },
        {
          csoNm: "중구청 민원여권과",
          taskNm: "여권교부",
          wtngCnt: 3,
          totDt: "20260410103100",
        },
      ],
      numOfRows: 10,
      pageNo: 1,
      totalCount: 2,
    },
  },
};

const emptyPayload = {
  response: {
    header: {
      resultCode: "00",
      resultMsg: "NORMAL SERVICE.",
    },
    body: {
      items: [],
      numOfRows: 10,
      pageNo: 1,
      totalCount: 0,
    },
  },
};

const livePayload = {
  header: {
    resultCode: "K0",
    resultMsg: "NORMAL_SERVICE",
  },
  body: {
    items: {
      item: [
        {
          stdgCd: "1121500000",
          csoSn: "CS0001",
          csoNm: "광진구청",
          taskNo: "1",
          taskNm: "출생,혼인/이혼,사망",
          clotNo: "55",
          wtngCnt: "0",
          totDt: "20260410192303",
        },
      ],
    },
    numOfRows: 2,
    pageNo: 1,
    totalCount: 112,
  },
};

assert.deepEqual(parsePublicDataRealtimeResponse(successPayload), {
  items: successPayload.response.body.items,
  totalCount: 2,
  pageNo: 1,
  numOfRows: 10,
});

assert.deepEqual(mapPublicDataRealtimeItems(successPayload.response.body.items), [
  {
    officeName: "종로구청 여권 민원실",
    taskName: "4.여권신청",
    waitingCount: 8,
    totalDateTime: "20260410103000",
  },
  {
    officeName: "중구청 민원여권과",
    taskName: "여권교부",
    waitingCount: 3,
    totalDateTime: "20260410103100",
  },
]);

assert.deepEqual(parsePublicDataRealtimeResponse(emptyPayload), {
  items: [],
  totalCount: 0,
  pageNo: 1,
  numOfRows: 10,
});

assert.deepEqual(parsePublicDataRealtimeResponse(livePayload), {
  items: livePayload.body.items.item,
  totalCount: 112,
  pageNo: 1,
  numOfRows: 2,
});

assert.throws(
  () =>
    parsePublicDataRealtimeResponse({
      response: {
        header: {
          resultCode: "30",
          resultMsg: "SERVICE KEY IS NOT REGISTERED ERROR.",
        },
        body: {
          items: [],
          totalCount: 0,
        },
      },
    }),
  (error: unknown) =>
    error instanceof PublicDataApiError &&
    error.code === "PUBLIC_DATA_API_ERROR" &&
    error.message === "SERVICE KEY IS NOT REGISTERED ERROR.",
);

console.log("public-data realtime spec passed");
