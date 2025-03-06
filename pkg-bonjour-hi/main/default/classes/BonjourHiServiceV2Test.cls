@IsTest
public with sharing class BonjourHiServiceV2Test {
  @IsTest
  static void testGreet() {
    BonjourHiServiceV2 service = new BonjourHiServiceV2();
    String result = service.greet('Bob');
    Assert.areEqual('Bonjour Bob!', result);
  }
}
