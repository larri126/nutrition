"use client";

import { SmartCanvas } from "@/ubs/core/SmartCanvas";
import { SmartBox } from "@/ubs/core/SmartBox";

export default function Page() {
return (
  <SmartCanvas cols={2} rows={2}> 
    <SmartBox cell="1A" fusion="1A 2A" w="15%">
      <SmartCanvas cols={1} rows={10}>
        <SmartBox cell="1A"></SmartBox>
        <SmartBox cell="3A">Aitana</SmartBox>
        <SmartBox cell="4A">Mar</SmartBox>
        <SmartBox cell="5A"></SmartBox>
        <SmartBox cell="6A"></SmartBox>
        <SmartBox cell="7A"></SmartBox>
        <SmartBox cell="10A"></SmartBox>
      </SmartCanvas>
    </SmartBox>
      <SmartBox cell="1B" h="10%">
        <SmartCanvas cols={10} rows={1}>
          <SmartBox cell="1G"></SmartBox>
          <SmartBox cell="1H"></SmartBox>
          <SmartBox cell="1I"></SmartBox>
          <SmartBox cell="1J"></SmartBox>
        </SmartCanvas>
      </SmartBox> 
      <SmartBox cell="2B" scrollable={true}>
       <SmartCanvas cols={1} rows={10}>
          <SmartBox cell="1A" scrollable={false} rowSize="auto">
          </SmartBox>
          <SmartBox cell="2A"></SmartBox>
          <SmartBox cell="3A"></SmartBox>
          <SmartBox cell="4A"></SmartBox>
          <SmartBox cell="5A"></SmartBox>
          <SmartBox cell="6A"></SmartBox>
          <SmartBox cell="7A"></SmartBox>
          <SmartBox cell="8A"></SmartBox>
          <SmartBox cell="9A"></SmartBox>
          <SmartBox cell="10A"></SmartBox>
       </SmartCanvas>
     </SmartBox>

  </SmartCanvas>
);
}
