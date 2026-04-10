import assert from "node:assert/strict";

import {
  PublicDataApiError,
  mapPublicDataRealtimeItems,
  parsePublicDataRealtimeResponse,
} from "../src/server/public-data.js";

async function main() {
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

  console.log("public-data spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
