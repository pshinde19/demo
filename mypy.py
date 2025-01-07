import random
import string
from flask import Flask,request,jsonify,render_template,redirect,session,send_from_directory
from route_functions import perform_llm_call, get_tables, ret_data_catalog
import pandas as pd
from modules.functions import execute_query
import csv
import os
import json
import base64
import hashlib
import requests
import secrets
from dotenv import load_dotenv
import configparser
# from flask_cors import CORS
# from flask_login import (
#     LoginManager,
#     current_user,
#     login_required,
#     login_user,
#     logout_user,
# )
import logging
from logging import Formatter, FileHandler
import plotly.io as pio
import warnings
warnings.filterwarnings('ignore')
from apscheduler.schedulers.background import BackgroundScheduler
import pyodbc



# from user import User
 #
# load_dotenv('.okta.env')

app = Flask(__name__)
app.secret_key = os.getenv("OKTA_APP_SECRET_KEY")
# csrf = CSRFProtect(app)


@app.after_request
def add_csp_header(response):
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' ; "
        "style-src 'self' 'unsafe-inline' ; "
        "img-src 'self' data: ; "
        "connect-src 'self' ; "
        "font-src 'self'  ; "
        "frame-src 'self' ; "
        "media-src 'self' ; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "form-action 'self'; "
      # "frame-ancestors 'self' http://corp-wap-eus-dev-tas-genaipg-01.azurewebsites.net https://corp-wap-eus-dev-tas-genaipg-01.azurewebsites.net"
        "frame-ancestors 'self' http://corp-wap-eus-dev-tas-genaipg-01.azurewebsites.net https://corp-wap-eus-dev-tas-genaipg-01.azurewebsites.net https://corp-wap-eus-prod-tas-genaipg-01.azurewebsites.net"
    )
    # HTTP Strict Transport Security (HSTS)    
    response.headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains;'
    # X-Content-Type-Options    
    response.headers['X-Content-Type-Options'] = 'nosniff'
    # X-Frame-Options    
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    return response
config = configparser.ConfigParser()
config.read(os.path.join("Config","config.ini"))
if config["config"]["env"]=='local':
    root_folder='logs'
    redirect_url="http://localhost:5000"
elif config["config"]["env"]=='dev':
    root_folder=os.path.join("/home","logs")
    redirect_url="https://accessrobo.genpact.com"
elif config["config"]["env"]=='prod':
    root_folder=os.path.join("/home","logs")
    redirect_url="https://aidataassistant.genpact.com"


if not os.path.exists(root_folder):
    os.mkdir(root_folder)

scheduler = BackgroundScheduler()
def push_datalogs():
    logs_folder = root_folder
    datalogs=pd.read_csv(os.path.join(logs_folder, 'datalog.csv'))
    feedbacklogs=pd.read_csv(os.path.join(logs_folder, 'feedbacklog.csv'))
    datalogs['OHR']=datalogs['OHR'].astype('str')
    feedbacklogs['OHR']=feedbacklogs['OHR'].astype('str')
    data=datalogs.merge(feedbacklogs, on=['OHR', 'DataProduct', 'Question', 'QueryTimeStamp', 'ResponseTimeStamp'], how='left')
    server = os.getenv("fabric_server")
    database=os.getenv("fabric_database")
    #clientId = f"d0a84259-e0d2-4523-b243-d5fb01287d86@{tenant_id}"
    clientId=os.getenv("fabric_clientId")
    clientSecret = os.getenv("fabric_clientSecret")
    #print(data.head(2))
    constr = f"driver=ODBC Driver 17 for SQL Server;server={server};database={database};UID={clientId};PWD={clientSecret};Authentication=ActiveDirectoryServicePrincipal;Encrypt=yes;Timeout=60;"
    con = pyodbc.connect(constr)
    try:
        cursor=con.cursor()
    except Exception as e:
        print("Error in pushing logs",e)
    for index, row in data.iterrows():
        print(index)
        try:
            insert_sql=f'''INSERT INTO [CWD].[CWD_DATALOG] VALUES ('{row['OHR']}','{row['DataProduct']}','{row['Question']}','{row['QueryTimeStamp']}','{row['ResponseTimeStamp']}','{row['RespType_x']}','{row['RespType_y']}') '''
            #insert_sql=f'''INSERT INTO [CWD].[CWD_DATALOG] VALUES ('{row['OHR']}','{row['DataProduct']}','{row['Question']}','{row['QueryTimeStamp']}','{row['ResponseTimeStamp']}','{row['RespType']}','{row['Feedback']}') '''
            cursor.execute(insert_sql)
        except Exception as e:
            print(e)
            pass
    datalogs=datalogs.head(0) 
    feedbacklogs=feedbacklogs.head(0)
    datalogs.to_csv(os.path.join(logs_folder, 'datalog.csv'),index=False)
    feedbacklogs.to_csv( os.path.join(logs_folder, 'feedbacklog.csv'),index=False)

    con.commit()
    con.close()

scheduler.configure()
 
# Schedule the task at 1 am every day
scheduler.add_job(push_datalogs, 'cron', hour=21,minute=30)
 

scheduler.start()

LOG_FORMAT = ("%(asctime)s [%(levelname)s]: %(message)s")
LOG_LEVEL=logging.INFO
critical_logger = logging.getLogger('critical_logger')
critical_logger.setLevel(LOG_LEVEL)
critical_handler = FileHandler(os.path.join(root_folder,"critical_logs.log"))
critical_handler.setLevel(LOG_LEVEL) 
critical_handler.setFormatter(Formatter(LOG_FORMAT))
critical_logger.addHandler(critical_handler)

session_logger = logging.getLogger('session_logger')
session_logger.setLevel(LOG_LEVEL)
session_handler = FileHandler(os.path.join(root_folder,"session_logs.log"))
session_handler.setLevel(LOG_LEVEL) 
session_handler.setFormatter(Formatter(LOG_FORMAT))
session_logger.addHandler(session_handler)

# login_manager = LoginManager()
# login_manager.init_app(app)
 
  
# @login_manager.user_loader
# def load_user(user_id):
#     return User.get(user_id)

@app.route('/')
#@login_required
def main_page():
    name='hjvkjgvjhvbjk'
    ohr_email='jhbjjbjhb'
    session['userinfo_response']={'name':name,'preferred_username':ohr_email}
    return render_template('main2.html')


# @app.route("/",methods=['GET'])
# def login(): 
#     pid=os.getpid()
#     session_logger.info(f"LOG IN:: PID:{str(pid)} ,Session: {str(session)},")
#     # store app state and code verifier in session
#     session['app_state'] = secrets.token_urlsafe(64)
#     session['code_verifier'] = secrets.token_urlsafe(64)
#     # calculate code challenge
#     hashed = hashlib.sha256(session['code_verifier'].encode('ascii')).digest()
#     encoded = base64.urlsafe_b64encode(hashed)
#     code_challenge = encoded.decode('ascii').strip('=')
#     query_params = {'client_id': os.getenv("OKTA_CLIENT_ID"),
#                     #'redirect_uri': os.getenv("OKTA_REDIRECT_URL"),
#                     #'redirect_uri': "https://accessrobo.genpact.com/authorization-code/callback",
#                     'redirect_uri': f"{redirect_url}/authorization-code/callback",
#                     'scope': "openid email profile offline_access",
#                     'state': session['app_state'],
#                     'code_challenge': code_challenge,
#                     'code_challenge_method': 'S256',
#                     'response_type': 'code',
#                     'response_mode': 'query'}
#     request_uri = "{base_url}?{query_params}".format(
#         base_url=os.getenv("OKTA_ORG_URL") + "oauth2/default/v1/authorize",
#         query_params=requests.compat.urlencode(query_params)
#     )
#     try:
#         temp_os=os.getenv("OKTA_REDIRECT_URL")
#         base_url_temp=os.getenv("OKTA_ORG_URL")
        
#     except:
#         pass
#     try:
#         temp_req=requests.compat.urlencode(query_params)
        
#     except:
#         pass
#     return redirect(request_uri)

# @app.route("/authorization-code/callback")
# def callback():
#     headers = {'Content-Type': 'application/x-www-form-urlencoded'}
#     code = request.args.get("code")
#     app_state = request.args.get("state")
#     if app_state != session['app_state']:
#         return "The app state does not match"
#     if not code:
#         return "We had an issue with OKTA Authentication, Make sure you have access to this app in OKTA.", 403
#     query_params = {'grant_type': 'authorization_code',
#                     'code': code,
#                     #'redirect_uri': request.base_url,
#                     'redirect_uri': f"{redirect_url}/authorization-code/callback",
#                     #'redirect_uri': "https://accessrobo.genpact.com/authorization-code/callback",
#                     #'redirect_uri': os.getenv("OKTA_REDIRECT_URL"),
#                     'code_verifier': session['code_verifier'],
#                     }

#     query_params = requests.compat.urlencode(query_params)
#     exchange = requests.post(
#         os.getenv("OKTA_ORG_URL") + "oauth2/default/v1/token",
#         headers=headers,
#         data=query_params,
#         auth=(os.getenv("OKTA_CLIENT_ID"), os.getenv("OKTA_CLIENT_SECRET")),
#     ).json()

#     # Get tokens and validate
#     if not exchange.get("token_type"):
#         return "Unsupported token type. Should be 'Bearer'.", 403
#     access_token = exchange["access_token"]
#     print(access_token)
#     id_token = exchange["id_token"]
#     # Authorization flow successful, get userinfo and login user
#     userinfo_response = requests.get(os.getenv("OKTA_ORG_URL") + "oauth2/default/v1/userinfo",headers={'Authorization': f'Bearer {access_token}'}).json()
#     unique_id = userinfo_response["sub"]
#     user_email = userinfo_response["email"]
#     user_name = userinfo_response["given_name"]
#     session['userinfo_response']={'name':userinfo_response['name'],'preferred_username':userinfo_response['preferred_username']}
#     user = User(id_=unique_id, name=user_name, email=user_email)
#     if not User.get(unique_id):
#         User.create(unique_id, user_name, user_email)
#     login_user(user)
#     #return redirect("https://accessrobo.genpact.com/main")
#     return redirect(f"{redirect_url}/main")
    
#     #return redirect(url_for("main_page"))
#     #return redirect(url_for("main_page"))


@app.route('/get_tables',methods=['GET'])
#@login_required
def get_values():
    pid=os.getpid()
    session_logger.info(f"GET TABLES:: PID:{str(pid)} ,Session: {str(session)},")
    try:
        ohr_id=session['userinfo_response']['preferred_username'].split('@')[0].strip()
        user_name=session['userinfo_response']['name']
        my_list,myhtmlstr,fav,faq,history=get_tables(ohr_id=ohr_id,name=user_name)
        #print(history)
        session['allowed_tables']=my_list
        session.modified = True 
        return jsonify({'msg':'success','my_list':my_list,'history':fav,'faq':faq,"previous_questions":history,'myhtmlstr':myhtmlstr,'metadata':session['userinfo_response']})
    except Exception as e:
        print(e)
        return jsonify({'msg':'error','error':"Internal Server error..."})

@app.route('/getdatacatalogue', methods=['POST'])
#@login_required
def getdatacatalogue():
    if request.method == 'POST':
        table_name=request.form['tablename']
        if 'allowed_tables' not in session or table_name not in session['allowed_tables']:
                return jsonify({'msg':'error','error':'Unauthorized Access','result':{"responsetype":"Not Answered"}})
        try:
            summary,table_list=ret_data_catalog(table_name=table_name)
            return jsonify({"summary":summary,"tableinfo":table_list,"msg":"success"})
        except Exception as e:
            print(e)
            return jsonify({'msg':'error','error':'Internal Server Error...','result':{"responsetype":"Not Answered"}})

@app.route('/getanswer',methods=['POST'])
#@login_required
def getanswer():
    pid=os.getpid()
    session_logger.info(f"GET ANSWER:: PID:{str(pid)} ,Session: {str(session)},")
    try:
        if request.method == 'POST':
            graph_toggle=request.form['is_graph']
            exp=request.form['experience']
            exc_exp=request.form['exclude_experience']
            qid=request.form['qid']
            if exp=='true' and exc_exp=='false':
                exp_toggle='exp'
            elif exp=='false' and exc_exp=='true':
                exp_toggle='excl_exp'
            else:
                exp_toggle='both'
            #exp_toggle='exp'
            #print(graph_toggle)
            if graph_toggle=='false':
                graph_toggle=False
            else:
                graph_toggle=True
            # print(graph_toggle)
            que=request.form['que']
            tablename=request.form['tablename']
            ohr_id=session['userinfo_response']['preferred_username'].split('@')[0].strip()
            denomination=request.form['currency']
            # print(denomination)
            session_history=request.form['session_history']
            history = json.loads(session_history)
            last_3_ques=history[-3:]
            if 'allowed_tables' not in session or tablename not in session['allowed_tables']:
                return jsonify({'msg':'error','error':'Unauthorized Access','result':{"responsetype":"Not Answered"}})
            response, new_data, graph_img, responsetype, sql_code, python_code, graph_code = perform_llm_call(user_question=que,vectordb='',ohr=ohr_id,dashboard=tablename,context=last_3_ques,denomination=denomination,graph_toggle=graph_toggle,exp_toggle=exp_toggle,qid=qid)
            new_data1=''
            graph_html=''
            config = {'responsive': True}
            # if(graph_img != None):
            #     graph_html = pio.to_html(graph_img,config=config,include_plotlyjs=False,full_html=True) 
            #print(type(graph_img))
            try:
                if(graph_img != None):
                    graph_img.update_layout(
                        autosize=True
                    #     width=350,
                    #     height=350
                    #     # margin=dict(l=0, r=0, t=0, b=0)
                    )
                    # graph_html = pio.to_html(graph_img,config=config,include_plotlyjs=False,full_html=True)
                    graph_html =pio.to_json(graph_img)
            except:
                graph_html=''
            if(isinstance(new_data, pd.DataFrame)):
                new_data=new_data[:2000]
                new_data.index=new_data.index + 1
                new_data1=new_data.to_html()
                id=generate_random_id(10)
                new_data1 = new_data1.replace('<table', f'<table class="my_table" id="{id}"', 1)
            if(response == None):
                #response="I had some trouble connecting to my servers, can you try again ?"
                response="I apologize, but I don't have sufficient information to provide an answer."
                rtype="Not Answered"
            else:
                rtype=responsetype
            rdata={ 
                'data_product':tablename,
                'question':que,
                'sql_code':sql_code,
                'python_code':python_code ,
                'graph_code':graph_code
              }
            result={'new_data':new_data1,'graph_html':graph_html,'response':response,'responsetype':rtype,'rdata':rdata}
            return jsonify({'msg':'success','result':result})
    except Exception as e:
        print(f"Critical Error: {e}")
        critical_logger.error(f"Connectivity Issue: {e}")
        return jsonify({'msg':'error','error':'It appears there are some connectivity issues. Please try again.','result':{"responsetype":"Not Answered"}})


# @app.errorhandler(404)
# def page_not_found(e):
#     return render_template('error.html'), 404

def generate_random_id(length=10):
    if length < 1:
        raise ValueError("Length must be at least 1")
    # First character should be a letter
    first_char = random.choice(string.ascii_lowercase)
    # Remaining characters can be letters or digits
    characters = string.ascii_lowercase + '123456789'
    remaining_chars = ''.join(random.choice(characters) for _ in range(length - 1))
    random_id = first_char + remaining_chars
    return random_id

@app.route('/feedbacklogs', methods=['POST'])
#@login_required
def reactedlogs(): 
    data = request.json
    Username=session['userinfo_response']['preferred_username'].split('@')[0].strip()                                #data['username']
    DataProduct=data['dataproduct']
    TimeStampQuery = data['timestampquery']
    TimeStampResponse =data['timestampresponse']
    usermassage = data['question']
    responsetype = data['responsetype']
    #logs_folder = os.path.join(os.getcwd(), 'logs')
    logs_folder = root_folder
    #csv_file_path = logs_folder+"/feedbacklog.csv"
    csv_file_path = os.path.join(logs_folder, 'feedbacklog.csv')
    file_exists = os.path.isfile(csv_file_path)
    with open(csv_file_path, mode='a', newline='') as f:
        fieldnames = ['OHR','DataProduct','Question','QueryTimeStamp','ResponseTimeStamp','RespType']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
    with open(csv_file_path, mode='a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writerow({'OHR':Username,'DataProduct':DataProduct,'QueryTimeStamp': TimeStampQuery,'ResponseTimeStamp':TimeStampResponse,'RespType':responsetype,'Question': usermassage})
    return jsonify({'msg':'success'})
 
@app.route('/datalogs', methods=['POST'])
#@login_required
def write_to_second_csv():
    data = request.json
    Username=session['userinfo_response']['preferred_username'].split('@')[0].strip()
    DataProduct=data['dataproduct']
    TimeStampQuery = data['timestampquery']
    TimeStampResponse =data['timestampresponse']
    usermassage = data['question']
    responsetype = data['responsetype']
    logs_folder = root_folder
    csv_file_path = os.path.join(logs_folder, 'datalog.csv')
    file_exists = os.path.isfile(csv_file_path)
    with open(csv_file_path, mode='a', newline='') as f:
        import time
        fieldnames = ['OHR','DataProduct','Question','QueryTimeStamp','ResponseTimeStamp','RespType']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
    with open(csv_file_path, mode='a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writerow({'OHR':Username,'DataProduct':DataProduct,'QueryTimeStamp': TimeStampQuery,'ResponseTimeStamp':TimeStampResponse,'RespType':responsetype,'Question': usermassage})
    return jsonify({'msg':'success'})


@app.route('/Protected/<path:filename>')
#@login_required
def protected_static(filename):
    # print('function called for file....')
    # print('filename',filename)
    return send_from_directory('Protected', filename)

@app.route('/deletequestion/<string:id>', methods=['DELETE'])
def delete_history(id):
    try:
        remove_fav(id)
        return jsonify({'msg': 'success'}),200
    except Exception as e:
        #print('-----')
        return jsonify({'msg': 'fail', 'error': str(e)}),200
    
@app.route('/insertquestion', methods=['POST'])
def insertquestion():
    try:
        data = request.get_json()
        #print(data)  
        #print(data['data_product'])
        qid=insert_fav(session['userinfo_response']['preferred_username'].split('@')[0].strip(),data['data_product'],data['question'],data['sql_code'],data['python_code'],data['graph_code'])
        #print("INSERT QID:",qid)
        mdict={"qid":qid,"dataproduct":data['data_product']}
        return jsonify({'msg': 'success','dbdata':mdict}), 200
    except Exception as e:
        return jsonify({'msg': 'fail', 'error': str(e)}), 200
    

def remove_fav(qid: str):
    server = os.getenv("fabric_server")
    database=os.getenv("fabric_database")
    #clientId = f"d0a84259-e0d2-4523-b243-d5fb01287d86@{tenant_id}"
    clientId=os.getenv("fabric_clientId")
    clientSecret = os.getenv("fabric_clientSecret")
    constr = f"driver=ODBC Driver 17 for SQL Server;server={server};database={database};UID={clientId};PWD={clientSecret};Authentication=ActiveDirectoryServicePrincipal;Encrypt=yes;Timeout=60;"
    con = pyodbc.connect(constr)
    query=f'''DELETE FROM [CWD].[CWD_FAV_QUESTIONS] WHERE [QID]='{qid}' '''
    cursor=con.cursor()
    cursor.execute(query)
    con.commit()
    #print(f"{qid} fav removed.")
    con.close()

def insert_fav(ohr,data_product,question,sql_code,python_code,graph_code):
    server = os.getenv("fabric_server")
    database=os.getenv("fabric_database")
    #clientId = f"d0a84259-e0d2-4523-b243-d5fb01287d86@{tenant_id}"
    clientId=os.getenv("fabric_clientId")
    clientSecret = os.getenv("fabric_clientSecret")
    constr = f"driver=ODBC Driver 17 for SQL Server;server={server};database={database};UID={clientId};PWD={clientSecret};Authentication=ActiveDirectoryServicePrincipal;Encrypt=yes;Timeout=60;"
    query='SELECT count([QID]) as row_count FROM [CWD].[CWD_FAV_QUESTIONS] '
    temp=execute_query(query)
    qid=str(int(temp['row_count'][0])+1)
    con = pyodbc.connect(constr)
    query='SELECT * FROM [CWD].[CWD_FAV_QUESTIONS]'
    cursor=con.cursor()
    #insert_sql=f'''INSERT INTO [CWD].[CWD_FAV_QUESTIONS] VALUES ('{qid}','{ohr}','{data_product}','{question}','{sql_code}','{python_code}','{graph_code}') '''
    insert_sql=f'''INSERT INTO [CWD].[CWD_FAV_QUESTIONS] VALUES (?,?,?,?,?,?,?) '''
    #print(insert_sql)
    cursor.execute(insert_sql,qid,ohr,data_product,question,sql_code,python_code,graph_code)
    con.commit()
    con.close()
    return qid

if __name__ == '__main__':
    app.run(debug=True,port=8002)
